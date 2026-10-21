import SwiftUI
import RareCandyKit

/// Le programme : la liste ordonnée des jours d'entraînement (Jour 1, Jour 2, …).
struct ProgramView: View {
    @Environment(AppModel.self) private var model
    @State private var isAddingDay = false
    @State private var newDayName = ""

    var body: some View {
        @Bindable var model = model
        NavigationStack {
            List {
                Section {
                    ForEach($model.data.days) { $day in
                        NavigationLink {
                            DayEditorView(day: $day)
                        } label: {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(Format.dayTitle(index: index(of: day), name: day.name))
                                Text(day.exercises.map(\.name).joined(separator: ", "))
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                                    .lineLimit(2)
                            }
                        }
                    }
                    .onDelete { offsets in
                        model.data.deleteDays(ids: Set(offsets.map { model.data.days[$0].id }))
                    }
                    .onMove { model.data.days.move(fromOffsets: $0, toOffset: $1) }
                } footer: {
                    Text("Les jours s'enchaînent dans cet ordre. Après ta dernière séance, l'app te propose le jour suivant. Supprimer un jour conserve son historique.")
                }
            }
            .overlay {
                if model.data.days.isEmpty {
                    ContentUnavailableView {
                        Label("Aucun jour", systemImage: "calendar.badge.plus")
                    } description: {
                        Text("Ajoute un jour (ex. « Pecs ») puis ses exercices.")
                    } actions: {
                        Button("Ajouter un jour") { isAddingDay = true }
                            .buttonStyle(.borderedProminent)
                        Button("Charger un programme exemple") { model.loadSampleProgram() }
                    }
                }
            }
            .navigationTitle("Programme")
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Menu {
                        Button("Charger un programme exemple") { model.loadSampleProgram() }
                        ShareLink(item: model.dataFileURL) {
                            Label("Exporter mes données (JSON)", systemImage: "square.and.arrow.up")
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    EditButton()
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        isAddingDay = true
                    } label: {
                        Image(systemName: "plus")
                    }
                    .accessibilityLabel("Ajouter un jour")
                }
            }
            .alert("Nouveau jour", isPresented: $isAddingDay) {
                TextField("Nom (ex. Pecs)", text: $newDayName)
                Button("Ajouter") {
                    model.data.addDay(named: newDayName)
                    newDayName = ""
                }
                Button("Annuler", role: .cancel) { newDayName = "" }
            }
        }
    }

    private func index(of day: TrainingDay) -> Int {
        model.data.days.firstIndex { $0.id == day.id } ?? 0
    }
}
