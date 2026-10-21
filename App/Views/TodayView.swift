import SwiftUI
import RareCandyKit

/// Écran d'accueil : la prochaine séance de la rotation avec ses objectifs.
struct TodayView: View {
    @Environment(AppModel.self) private var model
    @State private var isWorkoutPresented = false
    @State private var dayToConfirm: TrainingDay?

    var body: some View {
        NavigationStack {
            Group {
                if model.data.days.isEmpty {
                    ContentUnavailableView {
                        Label("Aucun programme", systemImage: "dumbbell")
                    } description: {
                        Text("Crée tes jours d'entraînement dans l'onglet Programme, ou charge un exemple pour tester.")
                    } actions: {
                        Button("Charger un programme exemple") { model.loadSampleProgram() }
                            .buttonStyle(.borderedProminent)
                    }
                } else {
                    dayList
                }
            }
            .navigationTitle("Séance")
            .fullScreenCover(isPresented: $isWorkoutPresented) {
                WorkoutView()
                    .environment(model)
            }
            .confirmationDialog(
                "Une séance est déjà en cours",
                isPresented: Binding(
                    get: { dayToConfirm != nil },
                    set: { if !$0 { dayToConfirm = nil } }
                ),
                titleVisibility: .visible,
                presenting: dayToConfirm
            ) { day in
                Button("Reprendre la séance en cours") { isWorkoutPresented = true }
                Button("Abandonner et commencer « \(day.name) »", role: .destructive) {
                    model.startWorkout(day: day)
                    isWorkoutPresented = true
                }
                Button("Annuler", role: .cancel) {}
            }
        }
    }

    private var dayList: some View {
        List {
            if let draft = model.data.activeWorkout {
                Section("Séance en cours") {
                    Button {
                        isWorkoutPresented = true
                    } label: {
                        Label("Reprendre : \(draft.dayName)", systemImage: "play.circle.fill")
                    }
                }
            }

            if let next = model.data.nextDay() {
                Section("Prochaine séance") {
                    Text(title(for: next))
                        .font(.headline)
                    ForEach(next.exercises) { exercise in
                        VStack(alignment: .leading, spacing: 2) {
                            Text(exercise.name)
                            ExerciseTargetLine(recommendation: model.data.recommendation(for: exercise))
                        }
                    }
                    Button {
                        start(next)
                    } label: {
                        Label("Commencer", systemImage: "play.fill")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(next.exercises.isEmpty)
                }
            }

            Section("Choisir un autre jour") {
                ForEach(model.data.days) { day in
                    Button {
                        start(day)
                    } label: {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(title(for: day))
                                .foregroundStyle(Color.primary)
                            Text(subtitle(for: day))
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                    .disabled(day.exercises.isEmpty)
                }
            }
        }
    }

    private func title(for day: TrainingDay) -> String {
        let index = model.data.days.firstIndex { $0.id == day.id } ?? 0
        return Format.dayTitle(index: index, name: day.name)
    }

    private func subtitle(for day: TrainingDay) -> String {
        let count = "\(day.exercises.count) exercice\(day.exercises.count > 1 ? "s" : "")"
        guard let last = model.data.lastSessionDate(forDay: day.id) else { return count }
        return "\(count) · dernière séance \(Format.relative(last))"
    }

    private func start(_ day: TrainingDay) {
        if let draft = model.data.activeWorkout {
            if draft.dayID == day.id {
                isWorkoutPresented = true
            } else {
                dayToConfirm = day
            }
        } else {
            model.startWorkout(day: day)
            isWorkoutPresented = true
        }
    }
}

/// Résumé compact d'un objectif : « ↑ 3 × 11 @ 60 kg ».
struct ExerciseTargetLine: View {
    let recommendation: Recommendation

    var body: some View {
        switch recommendation.kind {
        case .firstSession:
            Text("Première fois : trouve ta charge pour \(recommendation.repRange.lower) reps")
                .font(.caption)
                .foregroundStyle(.secondary)
        case .addReps:
            Label(Format.targets(recommendation.targets), systemImage: "arrow.up.right")
                .font(.caption)
                .foregroundStyle(.secondary)
        case .increaseWeight:
            Label("Monte la charge : \(Format.targets(recommendation.targets))", systemImage: "arrow.up.circle.fill")
                .font(.caption.bold())
                .foregroundStyle(.orange)
        }
    }
}
