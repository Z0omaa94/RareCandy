import Charts
import SwiftUI
import RareCandyKit

/// Les exercices du programme, regroupés par jour.
struct ExerciseCatalogView: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        List {
            ForEach(Array(model.data.days.enumerated()), id: \.element.id) { index, day in
                Section(Format.dayTitle(index: index, name: day.name)) {
                    ForEach(day.exercises) { exercise in
                        NavigationLink {
                            ExerciseProgressView(exercise: exercise)
                        } label: {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(exercise.name)
                                ExerciseTargetLine(recommendation: model.data.recommendation(for: exercise))
                            }
                        }
                    }
                }
            }
        }
        .overlay {
            if model.data.days.isEmpty {
                ContentUnavailableView("Aucun exercice", systemImage: "dumbbell")
            }
        }
        .navigationTitle("Exercices")
    }
}

/// Courbe de progression et historique détaillé d'un exercice.
struct ExerciseProgressView: View {
    @Environment(AppModel.self) private var model
    let exercise: Exercise

    var body: some View {
        let history = model.data.history(forExercise: exercise.id)
        let points = history.map(ProgressPoint.init(record:))
        // Exercice au poids du corps : on suit les répétitions plutôt que la charge.
        let tracksReps = points.allSatisfy { $0.topWeight == 0 }

        List {
            Section("Prochaine séance") {
                RecommendationView(recommendation: model.data.recommendation(for: exercise))
            }

            if points.count >= 2 {
                Section(tracksReps ? "Répétitions totales" : "1RM estimé (kg)") {
                    Chart(points) { point in
                        let value = tracksReps ? Double(point.totalReps) : point.estimatedOneRepMax
                        LineMark(x: .value("Date", point.date), y: .value("Valeur", value))
                        PointMark(x: .value("Date", point.date), y: .value("Valeur", value))
                    }
                    .chartYScale(domain: .automatic(includesZero: false))
                    .frame(height: 200)
                    .padding(.vertical, 8)
                }
            }

            Section("Historique") {
                if history.isEmpty {
                    Text("Pas encore de séance pour cet exercice.")
                        .foregroundStyle(.secondary)
                }
                ForEach(history.reversed()) { record in
                    VStack(alignment: .leading, spacing: 2) {
                        Text(Format.sets(record.log.sets))
                        Text(Format.date(record.date))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
        .navigationTitle(exercise.name)
    }
}
