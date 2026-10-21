import Foundation
import Testing
@testable import RareCandyKit

private let monday = Date(timeIntervalSince1970: 1_800_000_000)

private func completeAll(_ draft: inout WorkoutDraft, weight: Double? = nil) {
    for e in draft.exercises.indices {
        for s in draft.exercises[e].sets.indices {
            if let weight { draft.exercises[e].sets[s].weight = weight }
            draft.exercises[e].sets[s].isCompleted = true
        }
    }
}

private func start(_ data: inout TrainingData, dayID: UUID, at date: Date) throws -> WorkoutDraft {
    let draft = data.startWorkout(dayID: dayID, at: date)
    return try #require(draft)
}

private func finish(_ data: inout TrainingData) throws -> WorkoutSummary {
    let summary = data.finishWorkout()
    return try #require(summary)
}

@Suite("Séances et rotation des jours")
struct TrainingDataTests {
    func makeData() -> TrainingData {
        TrainingData(days: [
            TrainingDay(name: "Pecs", exercises: [Exercise(name: "Développé couché")]),
            TrainingDay(name: "Dos", exercises: [Exercise(name: "Rowing")]),
        ])
    }

    @Test("Le scénario de l'utilisateur : pecs 3 × 10, la séance pecs suivante vise 11")
    func userScenario() throws {
        var data = makeData()
        let pecs = data.days[0]
        let bench = pecs.exercises[0]

        // Jour 1 : pecs, 3 séries de 10 à 60 kg.
        var draft = try start(&data, dayID: pecs.id, at: monday)
        #expect(draft.exercises[0].sets.map(\.reps) == [10, 10, 10])
        completeAll(&draft, weight: 60)
        data.activeWorkout = draft
        let summary = try finish(&data)
        #expect(summary.exercises[0].outcome == .noTarget)
        #expect(summary.exercises[0].next?.targets == Array(repeating: SetTarget(reps: 11, weight: 60), count: 3))

        // Jour 2 : dos (n'a aucun effet sur les pecs).
        #expect(data.nextDay()?.name == "Dos")
        var back = try start(&data, dayID: data.days[1].id, at: monday.addingTimeInterval(86_400))
        completeAll(&back, weight: 50)
        data.activeWorkout = back
        data.finishWorkout()

        // Retour aux pecs : objectif 11 répétitions par série.
        #expect(data.nextDay()?.id == pecs.id)
        let next = try start(&data, dayID: pecs.id, at: monday.addingTimeInterval(2 * 86_400))
        #expect(next.exercises[0].recommendation.kind == .addReps)
        #expect(next.exercises[0].sets.map(\.reps) == [11, 11, 11])
        #expect(next.exercises[0].sets.map(\.weight) == [60, 60, 60])
        #expect(data.recommendation(for: bench).lastPerformance?.log.sets == Array(repeating: SetLog(reps: 10, weight: 60), count: 3))
    }

    @Test("Seules les séries validées sont enregistrées")
    func onlyCompletedSetsAreSaved() throws {
        var data = makeData()
        var draft = try start(&data, dayID: data.days[0].id, at: monday)
        draft.exercises[0].sets[0].weight = 60
        draft.exercises[0].sets[0].isCompleted = true
        data.activeWorkout = draft
        let summary = try finish(&data)
        #expect(summary.session.exercises[0].sets == [SetLog(reps: 10, weight: 60)])
        #expect(data.activeWorkout == nil)
    }

    @Test("Aucune série validée : rien n'est enregistré et la séance reste ouverte")
    func nothingCompleted() throws {
        var data = makeData()
        data.startWorkout(dayID: data.days[0].id, at: monday)
        let result = data.finishWorkout()
        #expect(result == nil)
        #expect(data.sessions.isEmpty)
        #expect(data.activeWorkout != nil)
    }

    @Test("Record personnel détecté quand le 1RM estimé dépasse l'historique")
    func personalRecord() throws {
        var data = makeData()
        var draft = try start(&data, dayID: data.days[0].id, at: monday)
        completeAll(&draft, weight: 60)
        data.activeWorkout = draft
        let first = data.finishWorkout()
        #expect(first?.exercises[0].isPersonalRecord == false)

        draft = try start(&data, dayID: data.days[0].id, at: monday.addingTimeInterval(86_400))
        completeAll(&draft)
        data.activeWorkout = draft
        let summary = try finish(&data)
        #expect(summary.exercises[0].outcome == .met)
        #expect(summary.exercises[0].isPersonalRecord)
    }

    @Test("Rotation : le jour suivant celui de la dernière séance, en boucle")
    func rotation() {
        var data = makeData()
        #expect(data.nextDay()?.name == "Pecs")
        data.sessions.append(WorkoutSession(dayID: data.days[1].id, dayName: "Dos", date: monday, exercises: []))
        #expect(data.nextDay()?.name == "Pecs")
        // Une séance antidatée ne change pas la dernière séance.
        data.sessions.append(WorkoutSession(dayID: data.days[0].id, dayName: "Pecs", date: monday.addingTimeInterval(-86_400), exercises: []))
        #expect(data.nextDay()?.name == "Pecs")
        #expect(data.lastSessionDate(forDay: data.days[0].id) == monday.addingTimeInterval(-86_400))
    }

    @Test("Supprimer un jour conserve l'historique")
    func deletingDayKeepsHistory() throws {
        var data = makeData()
        var draft = try start(&data, dayID: data.days[0].id, at: monday)
        completeAll(&draft, weight: 60)
        data.activeWorkout = draft
        data.finishWorkout()
        data.deleteDays(ids: [data.days[0].id])
        #expect(data.days.count == 1)
        #expect(data.sessions.count == 1)
        #expect(data.nextDay()?.name == "Dos")
    }

    @Test func addSetCopiesLastSet() throws {
        var data = makeData()
        var draft = try start(&data, dayID: data.days[0].id, at: monday)
        draft.exercises[0].sets[2].weight = 42.5
        draft.exercises[0].addSet()
        #expect(draft.exercises[0].sets.count == 4)
        #expect(draft.exercises[0].sets[3].weight == 42.5)
        #expect(draft.exercises[0].sets[3].target == nil)
    }

    @Test func addDayUsesDefaultName() {
        var data = TrainingData()
        let unnamed = data.addDay(named: "  ")
        let named = data.addDay(named: " Pecs ")
        #expect(unnamed.name == "Jour 1")
        #expect(named.name == "Pecs")
    }
}

@Suite("Sauvegarde JSON")
struct PersistenceTests {
    func temporaryStore() -> JSONFileStore {
        let dir = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        return JSONFileStore(fileURL: dir.appendingPathComponent("training.json"))
    }

    @Test func missingFileLoadsNil() throws {
        #expect(try temporaryStore().load() == nil)
    }

    @Test func roundTrip() throws {
        let store = temporaryStore()
        var data = TrainingData(days: ProgramTemplates.pushPullLegs())
        var draft = try start(&data, dayID: data.days[0].id, at: monday)
        completeAll(&draft, weight: 60)
        data.activeWorkout = draft
        data.finishWorkout()
        data.startWorkout(dayID: data.days[1].id, at: monday)

        try store.save(data)
        #expect(try store.load() == data)
    }

    @Test func unreadableFileIsMovedAside() throws {
        let store = temporaryStore()
        try store.save(TrainingData())
        try Data("pas du json".utf8).write(to: store.fileURL)
        #expect(throws: (any Error).self) { try store.load() }

        let backup = try store.moveUnreadableFileAside(now: monday)
        #expect(FileManager.default.fileExists(atPath: backup.path))
        #expect(!FileManager.default.fileExists(atPath: store.fileURL.path))
        #expect(try store.load() == nil)
    }

    @Test func newerSchemaIsRejected() throws {
        let store = temporaryStore()
        var data = TrainingData()
        data.schemaVersion = TrainingData.currentSchemaVersion + 1
        try store.save(data)
        #expect(throws: PersistenceError.unsupportedSchemaVersion(TrainingData.currentSchemaVersion + 1)) {
            try store.load()
        }
    }
}
