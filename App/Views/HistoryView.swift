import SwiftUI
import RareCandyKit

struct HistoryView: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        NavigationStack {
            List {
                Section {
                    NavigationLink {
                        ExerciseCatalogView()
                    } label: {
                        Label("Progression par exercice", systemImage: "chart.xyaxis.line")
                    }
                }

                Section("Séances") {
                    let sessions = Array(model.data.sessionsByDate.reversed())
                    if sessions.isEmpty {
                        Text("Aucune séance enregistrée pour l'instant.")
                            .foregroundStyle(.secondary)
                    }
                    ForEach(sessions) { session in
                        NavigationLink {
                            SessionDetailView(sessionID: session.id)
                        } label: {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(session.dayName)
                                Text("\(Format.date(session.date)) · \(session.exercises.count) exercice\(session.exercises.count > 1 ? "s" : "")")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                    .onDelete { offsets in
                        model.data.deleteSessions(ids: Set(offsets.map { sessions[$0].id }))
                    }
                }
            }
            .navigationTitle("Historique")
        }
    }
}

struct SessionDetailView: View {
    @Environment(AppModel.self) private var model
    let sessionID: UUID

    var body: some View {
        if let session = model.data.sessions.first(where: { $0.id == sessionID }) {
            List {
                Section {
                    LabeledContent("Date", value: session.date.formatted(date: .complete, time: .shortened))
                    LabeledContent("Volume total", value: "\(Format.number(session.exercises.reduce(0) { $0 + $1.volume })) kg")
                }
                ForEach(session.exercises) { log in
                    Section(log.exerciseName) {
                        ForEach(Array(log.sets.enumerated()), id: \.offset) { index, set in
                            LabeledContent("Série \(index + 1)", value: "\(set.reps) reps @ \(Format.weight(set.weight))")
                        }
                    }
                }
            }
            .navigationTitle(session.dayName)
        } else {
            ContentUnavailableView("Séance supprimée", systemImage: "trash")
        }
    }
}
