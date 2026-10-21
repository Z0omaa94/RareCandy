import Foundation
import Testing
@testable import RareCandyKit

private func record(_ sets: [SetLog], daysAgo: Int = 0, exerciseID: UUID = UUID()) -> ExerciseRecord {
    ExerciseRecord(
        sessionID: UUID(),
        date: Date(timeIntervalSince1970: 1_800_000_000 - Double(daysAgo) * 86_400),
        log: ExerciseLog(exerciseID: exerciseID, exerciseName: "Test", sets: sets)
    )
}

private func sets(_ reps: [Int], at weight: Double) -> [SetLog] {
    reps.map { SetLog(reps: $0, weight: weight) }
}

@Suite("Double progression")
struct ProgressionEngineTests {
    let bench = Exercise(name: "Développé couché", targetSets: 3, repRange: RepRange(lower: 10, upper: 15), weightIncrement: 2.5)

    @Test("Sans historique : objectif = bas de la fourchette, charge à choisir")
    func firstSession() {
        let rec = ProgressionEngine.recommend(for: bench, history: [])
        #expect(rec.kind == .firstSession)
        #expect(rec.targets == Array(repeating: SetTarget(reps: 10, weight: nil), count: 3))
        #expect(rec.lastPerformance == nil)
    }

    @Test("3 × 10 la dernière fois → objectif 3 × 11 à la même charge")
    func addOneRepPerSet() {
        let rec = ProgressionEngine.recommend(for: bench, history: [record(sets([10, 10, 10], at: 60))])
        #expect(rec.kind == .addReps)
        #expect(rec.targets == Array(repeating: SetTarget(reps: 11, weight: 60), count: 3))
    }

    @Test("Séries inégales : +1 rep sur chaque série")
    func unevenSets() {
        let rec = ProgressionEngine.recommend(for: bench, history: [record(sets([12, 11, 9], at: 60))])
        #expect(rec.targets.map(\.reps) == [13, 12, 10])
    }

    @Test("Une série déjà au max reste plafonnée au max tant que les autres n'y sont pas")
    func capAtUpperBound() {
        let rec = ProgressionEngine.recommend(for: bench, history: [record(sets([15, 14, 13], at: 60))])
        #expect(rec.kind == .addReps)
        #expect(rec.targets.map(\.reps) == [15, 15, 14])
    }

    @Test("Toutes les séries à 15 → monter la charge et repartir à 10")
    func increaseWeightAtTop() {
        let rec = ProgressionEngine.recommend(for: bench, history: [record(sets([15, 15, 15], at: 60))])
        #expect(rec.kind == .increaseWeight(from: 60, to: 62.5))
        #expect(rec.targets == Array(repeating: SetTarget(reps: 10, weight: 62.5), count: 3))
    }

    @Test("Au-dessus du max compte aussi comme max atteint")
    func aboveUpperBound() {
        let rec = ProgressionEngine.recommend(for: bench, history: [record(sets([16, 15, 17], at: 60))])
        #expect(rec.kind == .increaseWeight(from: 60, to: 62.5))
    }

    @Test("Séries manquantes : pas de montée en charge, la série manquante reprend la dernière")
    func missingSetsBlockWeightIncrease() {
        let rec = ProgressionEngine.recommend(for: bench, history: [record(sets([15, 15], at: 60))])
        #expect(rec.kind == .addReps)
        #expect(rec.targets == Array(repeating: SetTarget(reps: 15, weight: 60), count: 3))
    }

    @Test("Séries en trop : on ne garde que le nombre de séries prévues")
    func extraSetsIgnored() {
        let rec = ProgressionEngine.recommend(for: bench, history: [record(sets([15, 15, 15, 8], at: 60))])
        #expect(rec.kind == .increaseWeight(from: 60, to: 62.5))
        #expect(rec.targets.count == 3)
    }

    @Test("Charges différentes par série : chaque série garde sa charge")
    func perSetWeights() {
        let history = [record([SetLog(reps: 10, weight: 60), SetLog(reps: 10, weight: 57.5), SetLog(reps: 10, weight: 55)])]
        let rec = ProgressionEngine.recommend(for: bench, history: history)
        #expect(rec.targets == [SetTarget(reps: 11, weight: 60), SetTarget(reps: 11, weight: 57.5), SetTarget(reps: 11, weight: 55)])
    }

    @Test("La recommandation se base sur la séance la plus récente")
    func usesMostRecentSession() {
        let history = [record(sets([10, 10, 10], at: 60), daysAgo: 14), record(sets([12, 12, 12], at: 60), daysAgo: 7)]
        let rec = ProgressionEngine.recommend(for: bench, history: history)
        #expect(rec.targets.map(\.reps) == [13, 13, 13])
        #expect(rec.lastPerformance == history[1])
    }

    @Test("Incrément de 0 : progression en reps sans plafond")
    func repsOnlyProgression() {
        let pullUps = Exercise(name: "Tractions", targetSets: 3, repRange: RepRange(lower: 5, upper: 10), weightIncrement: 0)
        let rec = ProgressionEngine.recommend(for: pullUps, history: [record(sets([10, 10, 10], at: 0))])
        #expect(rec.kind == .addReps)
        #expect(rec.targets.map(\.reps) == [11, 11, 11])
    }

    @Test("Poids du corps avec incrément : on conseille de lester")
    func bodyweightWithIncrement() {
        let dips = Exercise(name: "Dips", targetSets: 2, repRange: RepRange(lower: 8, upper: 12), weightIncrement: 5)
        let rec = ProgressionEngine.recommend(for: dips, history: [record(sets([12, 12], at: 0))])
        #expect(rec.kind == .increaseWeight(from: 0, to: 5))
        #expect(rec.targets == [SetTarget(reps: 8, weight: 5), SetTarget(reps: 8, weight: 5)])
    }

    @Test("Pas d'erreur d'arrondi après plusieurs incréments")
    func roundingIsStable() {
        let ex = Exercise(name: "Curl", targetSets: 1, repRange: RepRange(lower: 8, upper: 8), weightIncrement: 0.1)
        let rec = ProgressionEngine.recommend(for: ex, history: [record(sets([8], at: 0.2))])
        #expect(rec.kind == .increaseWeight(from: 0.2, to: 0.3))
    }

    @Test("Cycle complet : de 3 × 10 à la montée en charge")
    func fullCycle() {
        var history: [ExerciseRecord] = []
        var rec = ProgressionEngine.recommend(for: bench, history: history)
        // Première séance : l'utilisateur choisit 60 kg.
        var performed = rec.targets.map { SetLog(reps: $0.reps, weight: $0.weight ?? 60) }
        for day in 0..<6 {
            history.append(record(performed, daysAgo: 100 - day))
            rec = ProgressionEngine.recommend(for: bench, history: history)
            // L'utilisateur atteint exactement l'objectif à chaque fois.
            performed = rec.targets.map { SetLog(reps: $0.reps, weight: $0.weight ?? 0) }
        }
        // 10, 11, 12, 13, 14, 15 → la 6e recommandation demande de monter la charge.
        #expect(rec.kind == .increaseWeight(from: 60, to: 62.5))
        #expect(performed == sets([10, 10, 10], at: 62.5))
    }
}

@Suite("Évaluation de la séance")
struct EvaluationTests {
    let rec = ProgressionEngine.recommend(
        for: Exercise(name: "Squat", targetSets: 3),
        history: [record(sets([10, 10, 10], at: 100))]
    )

    @Test func met() {
        #expect(ProgressionEngine.evaluate(sets([11, 11, 11], at: 100), against: rec) == .met)
    }

    @Test func exceeded() {
        #expect(ProgressionEngine.evaluate(sets([12, 11, 11], at: 100), against: rec) == .exceeded)
        #expect(ProgressionEngine.evaluate(sets([11, 11, 11], at: 102.5), against: rec) == .exceeded)
    }

    @Test func missed() {
        #expect(ProgressionEngine.evaluate(sets([11, 11, 10], at: 100), against: rec) == .missed)
        #expect(ProgressionEngine.evaluate(sets([11, 11], at: 100), against: rec) == .missed)
        #expect(ProgressionEngine.evaluate(sets([12, 12, 12], at: 97.5), against: rec) == .missed)
    }

    @Test func firstSessionHasNoTarget() {
        let first = ProgressionEngine.recommend(for: Exercise(name: "Squat"), history: [])
        #expect(ProgressionEngine.evaluate(sets([10, 10, 10], at: 80), against: first) == .noTarget)
    }
}

@Suite("Détection de stagnation")
struct StallTests {
    @Test func progressResetsCounter() {
        let history = [record(sets([10, 10, 10], at: 60), daysAgo: 3), record(sets([11, 10, 10], at: 60), daysAgo: 2)]
        #expect(ProgressionEngine.sessionsWithoutProgress(history) == 0)
    }

    @Test func weightIncreaseCountsAsProgress() {
        let history = [record(sets([15, 15, 15], at: 60), daysAgo: 2), record(sets([10, 10, 10], at: 62.5), daysAgo: 1)]
        #expect(ProgressionEngine.sessionsWithoutProgress(history) == 0)
    }

    @Test func stalledAfterThreeSessionsWithoutProgress() {
        let history = [
            record(sets([12, 12, 12], at: 60), daysAgo: 4),
            record(sets([12, 12, 12], at: 60), daysAgo: 3),
            record(sets([12, 12, 11], at: 60), daysAgo: 2),
            record(sets([12, 11, 11], at: 60), daysAgo: 1),
        ]
        #expect(ProgressionEngine.sessionsWithoutProgress(history) == 3)
        let rec = ProgressionEngine.recommend(for: Exercise(name: "Test"), history: history)
        #expect(rec.isStalled)
    }
}

@Suite("Statistiques")
struct StatsTests {
    @Test func epley() {
        #expect(Stats.estimatedOneRepMax(weight: 100, reps: 1) == 100)
        #expect(Stats.estimatedOneRepMax(weight: 60, reps: 15) == 90)
        #expect(Stats.estimatedOneRepMax(weight: 0, reps: 10) == 0)
    }

    @Test func groupingSets() {
        let groups = SetGroup.group([SetLog(reps: 11, weight: 60), SetLog(reps: 11, weight: 60), SetLog(reps: 10, weight: 60)])
        #expect(groups == [SetGroup(count: 2, reps: 11, weight: 60), SetGroup(count: 1, reps: 10, weight: 60)])
    }

    @Test func repRangeStaysOrdered() {
        var range = RepRange(lower: 10, upper: 15)
        range.setLower(18)
        #expect(range == RepRange(lower: 18, upper: 18))
        range.setUpper(12)
        #expect(range == RepRange(lower: 12, upper: 12))
        #expect(RepRange(lower: 15, upper: 10) == RepRange(lower: 10, upper: 10))
    }
}
