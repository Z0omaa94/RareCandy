import SwiftUI
import RareCandyKit

/// Bilan de fin de séance : objectif atteint ou non, records, et objectif de la prochaine fois.
struct WorkoutSummaryView: View {
    let summary: WorkoutSummary
    let onClose: () -> Void

    var body: some View {
        List {
            Section {
                VStack(alignment: .leading, spacing: 4) {
                    Text("\(metCount)/\(summary.exercises.count) objectifs atteints")
                        .font(.title3.bold())
                    Text("\(summary.session.dayName) · \(Format.date(summary.session.date))")
                        .foregroundStyle(.secondary)
                }
            }

            ForEach(summary.exercises) { exercise in
                Section(exercise.name) {
                    Label(Format.outcome(exercise.outcome), systemImage: Format.outcomeSymbol(exercise.outcome))
                        .foregroundStyle(color(for: exercise.outcome))

                    if exercise.isPersonalRecord {
                        Label("Nouveau record (1RM estimé)", systemImage: "trophy.fill")
                            .foregroundStyle(.yellow)
                    }

                    LabeledContent("Réalisé", value: Format.sets(exercise.performed))
                    if exercise.target.kind != .firstSession {
                        LabeledContent("Objectif", value: Format.targets(exercise.target.targets))
                    }

                    if let next = exercise.next {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Prochaine fois")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            ExerciseTargetLine(recommendation: next)
                        }
                    }
                }
            }
        }
        .navigationTitle("Bilan")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                Button("Fermer") { onClose() }
            }
        }
    }

    private var metCount: Int {
        summary.exercises.filter { $0.outcome == .met || $0.outcome == .exceeded }.count
    }

    private func color(for outcome: TargetOutcome) -> Color {
        switch outcome {
        case .exceeded: return .orange
        case .met: return .green
        case .missed: return .red
        case .noTarget: return .secondary
        }
    }
}
