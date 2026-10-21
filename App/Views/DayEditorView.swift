import SwiftUI
import RareCandyKit

struct DayEditorView: View {
    @Binding var day: TrainingDay
    @State private var editedExercise: Exercise?
    @State private var isAddingExercise = false

    var body: some View {
        List {
            Section("Nom du jour") {
                TextField("Ex. Pecs", text: $day.name)
            }

            Section {
                ForEach(day.exercises) { exercise in
                    Button {
                        editedExercise = exercise
                    } label: {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(exercise.name)
                                .foregroundStyle(Color.primary)
                            Text(details(for: exercise))
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
                .onDelete { day.exercises.remove(atOffsets: $0) }
                .onMove { day.exercises.move(fromOffsets: $0, toOffset: $1) }

                Button {
                    isAddingExercise = true
                } label: {
                    Label("Ajouter un exercice", systemImage: "plus")
                }
            } header: {
                Text("Exercices")
            } footer: {
                Text("Supprimer un exercice efface sa progression de ce jour (l'historique des séances reste consultable).")
            }
        }
        .navigationTitle(day.name.isEmpty ? "Jour" : day.name)
        .toolbar { EditButton() }
        .sheet(item: $editedExercise) { exercise in
            NavigationStack {
                ExerciseEditorView(exercise: exercise, title: "Modifier") { day.upsert($0) }
            }
        }
        .sheet(isPresented: $isAddingExercise) {
            NavigationStack {
                ExerciseEditorView(exercise: Exercise(name: ""), title: "Nouvel exercice") { day.upsert($0) }
            }
        }
    }

    private func details(for exercise: Exercise) -> String {
        let increment = exercise.weightIncrement > 0
            ? "+\(Format.number(exercise.weightIncrement)) kg"
            : "reps uniquement"
        return "\(exercise.targetSets) séries · \(exercise.repRange.lower)–\(exercise.repRange.upper) reps · \(increment)"
    }
}
