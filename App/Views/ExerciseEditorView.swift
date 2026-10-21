import SwiftUI
import RareCandyKit

struct ExerciseEditorView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var exercise: Exercise
    let title: String
    let onSave: (Exercise) -> Void

    init(exercise: Exercise, title: String, onSave: @escaping (Exercise) -> Void) {
        _exercise = State(initialValue: exercise)
        self.title = title
        self.onSave = onSave
    }

    private var trimmedName: String {
        exercise.name.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    var body: some View {
        Form {
            Section("Exercice") {
                TextField("Nom (ex. Développé couché)", text: $exercise.name)
            }

            Section {
                Stepper("Séries : \(exercise.targetSets)", value: $exercise.targetSets, in: 1...10)
            }

            Section {
                Stepper("Minimum : \(exercise.repRange.lower) reps", value: lowerReps, in: 1...50)
                Stepper("Maximum : \(exercise.repRange.upper) reps", value: upperReps, in: 1...50)
            } header: {
                Text("Fourchette de répétitions")
            } footer: {
                Text("À chaque séance, l'objectif est +1 rep par série. Quand toutes les séries atteignent \(exercise.repRange.upper) reps, l'app te dit de monter la charge et tu repars à \(exercise.repRange.lower) reps.")
            }

            Section {
                HStack {
                    Text("Ajouter")
                    Spacer()
                    NumberField(placeholder: "2,5", value: $exercise.weightIncrement)
                        .frame(width: 80)
                    Text("kg")
                        .foregroundStyle(.secondary)
                }
            } header: {
                Text("Montée en charge")
            } footer: {
                Text("Mets 0 pour un exercice au poids du corps sans lest : l'objectif sera simplement +1 rep par série, sans plafond.")
            }

            Section("Notes") {
                TextField("Réglages machine, prise…", text: $exercise.notes, axis: .vertical)
            }
        }
        .navigationTitle(title)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("Annuler") { dismiss() }
            }
            ToolbarItem(placement: .confirmationAction) {
                Button("Enregistrer") {
                    exercise.name = trimmedName
                    onSave(exercise)
                    dismiss()
                }
                .disabled(trimmedName.isEmpty)
            }
        }
    }

    private var lowerReps: Binding<Int> {
        Binding(get: { exercise.repRange.lower }, set: { exercise.repRange.setLower($0) })
    }

    private var upperReps: Binding<Int> {
        Binding(get: { exercise.repRange.upper }, set: { exercise.repRange.setUpper($0) })
    }
}
