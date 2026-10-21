import SwiftUI
import UIKit
import RareCandyKit

/// Séance en cours, présentée en plein écran. Affiche le bilan une fois la séance terminée.
struct WorkoutView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    @State private var summary: WorkoutSummary?

    var body: some View {
        NavigationStack {
            if let summary {
                WorkoutSummaryView(summary: summary) { dismiss() }
            } else if let current = model.data.activeWorkout {
                ActiveWorkoutScreen(
                    draft: Binding(
                        get: { model.data.activeWorkout ?? current },
                        // Ne jamais recréer une séance terminée ou abandonnée.
                        set: { newValue in
                            if model.data.activeWorkout?.id == newValue.id {
                                model.data.activeWorkout = newValue
                            }
                        }
                    ),
                    onFinish: { summary = $0 },
                    onClose: { dismiss() }
                )
            } else {
                ContentUnavailableView("Aucune séance en cours", systemImage: "figure.cooldown")
                    .toolbar {
                        ToolbarItem(placement: .confirmationAction) {
                            Button("Fermer") { dismiss() }
                        }
                    }
            }
        }
    }
}

private struct ActiveWorkoutScreen: View {
    @Environment(AppModel.self) private var model
    @Binding var draft: WorkoutDraft
    let onFinish: (WorkoutSummary) -> Void
    let onClose: () -> Void

    @State private var isConfirmingDiscard = false
    @State private var isShowingNothingCompleted = false

    var body: some View {
        List {
            Section {
                DatePicker("Date", selection: $draft.startedAt)
            }

            ForEach($draft.exercises) { $exercise in
                DraftExerciseSection(exercise: $exercise)
            }

            Section {
                Button("Abandonner la séance", role: .destructive) {
                    isConfirmingDiscard = true
                }
            }
        }
        .scrollDismissesKeyboard(.interactively)
        .navigationTitle(draft.dayName)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("Réduire") { onClose() }
            }
            ToolbarItem(placement: .confirmationAction) {
                Button("Terminer") { finish() }
                    .bold()
            }
            ToolbarItemGroup(placement: .keyboard) {
                Spacer()
                Button("OK") { hideKeyboard() }
            }
        }
        .confirmationDialog("Abandonner la séance ?", isPresented: $isConfirmingDiscard, titleVisibility: .visible) {
            Button("Abandonner", role: .destructive) {
                model.discardWorkout()
                onClose()
            }
            Button("Continuer la séance", role: .cancel) {}
        } message: {
            Text("Les séries saisies ne seront pas enregistrées.")
        }
        .alert("Aucune série validée", isPresented: $isShowingNothingCompleted) {
            Button("OK", role: .cancel) {}
        } message: {
            Text("Touche le rond à droite de chaque série réalisée pour la valider avant de terminer.")
        }
    }

    private func finish() {
        hideKeyboard()
        if let summary = model.finishWorkout() {
            onFinish(summary)
        } else {
            isShowingNothingCompleted = true
        }
    }

    private func hideKeyboard() {
        UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
    }
}

private struct DraftExerciseSection: View {
    @Binding var exercise: DraftExercise

    var body: some View {
        Section {
            RecommendationView(recommendation: exercise.recommendation)

            ForEach($exercise.sets) { $set in
                SetRow(number: number(of: set), set: $set)
            }
            .onDelete { exercise.sets.remove(atOffsets: $0) }

            Button {
                exercise.addSet()
            } label: {
                Label("Ajouter une série", systemImage: "plus")
            }
        } header: {
            Text(exercise.name)
        }
    }

    private func number(of set: DraftSet) -> Int {
        (exercise.sets.firstIndex { $0.id == set.id } ?? 0) + 1
    }
}

private struct SetRow: View {
    let number: Int
    @Binding var set: DraftSet

    var body: some View {
        HStack(spacing: 12) {
            Text("\(number)")
                .font(.headline)
                .frame(width: 22)

            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 6) {
                    NumberField(placeholder: "0", value: $set.weight)
                        .frame(width: 64)
                        .textFieldStyle(.roundedBorder)
                    Text("kg")
                        .foregroundStyle(.secondary)
                    NumberField("0", integer: $set.reps)
                        .frame(width: 48)
                        .textFieldStyle(.roundedBorder)
                    Text("reps")
                        .foregroundStyle(.secondary)
                }
                if let target = set.target {
                    Text(targetText(target))
                        .font(.caption2)
                        .foregroundStyle(meetsTarget(target) ? Color.green : Color.secondary)
                }
            }

            Spacer()

            Button {
                set.isCompleted.toggle()
            } label: {
                Image(systemName: set.isCompleted ? "checkmark.circle.fill" : "circle")
                    .font(.title2)
                    .foregroundStyle(set.isCompleted ? Color.green : Color.secondary)
            }
            .buttonStyle(.borderless)
            .accessibilityLabel(set.isCompleted ? "Série validée" : "Valider la série")
        }
    }

    private func targetText(_ target: SetTarget) -> String {
        if let weight = target.weight {
            return "Objectif : \(target.reps) reps @ \(Format.weight(weight))"
        }
        return "Objectif : \(target.reps) reps"
    }

    private func meetsTarget(_ target: SetTarget) -> Bool {
        set.reps >= target.reps && set.weight >= (target.weight ?? 0)
    }
}
