import Foundation

/// Objectif pour une série de la prochaine séance.
public struct SetTarget: Codable, Hashable, Sendable {
    public var reps: Int
    /// `nil` lors de la première séance : c'est à l'utilisateur de choisir la charge.
    public var weight: Double?

    public init(reps: Int, weight: Double?) {
        self.reps = reps
        self.weight = weight
    }
}

/// Ce que l'app conseille pour la prochaine séance d'un exercice.
public struct Recommendation: Codable, Hashable, Sendable {
    public enum Kind: Codable, Hashable, Sendable {
        /// Aucun historique : trouver une charge permettant `repRange.lower` répétitions.
        case firstSession
        /// Garder la charge et viser une répétition de plus par série.
        case addReps
        /// Toutes les séries ont atteint `repRange.upper` : monter la charge
        /// et repartir à `repRange.lower` répétitions.
        case increaseWeight(from: Double, to: Double)
    }

    public var kind: Kind
    /// Un objectif par série prévue.
    public var targets: [SetTarget]
    public var repRange: RepRange
    public var weightIncrement: Double
    /// La dernière performance sur laquelle se base la recommandation.
    public var lastPerformance: ExerciseRecord?
    /// Nombre de séances consécutives (les plus récentes) sans progrès
    /// par rapport à la séance précédente.
    public var sessionsWithoutProgress: Int

    public var isStalled: Bool { sessionsWithoutProgress >= ProgressionEngine.stallThreshold }
}

/// Résultat d'une séance par rapport à l'objectif fixé.
public enum TargetOutcome: String, Codable, Hashable, Sendable {
    /// Toutes les séries atteignent l'objectif et au moins une le dépasse.
    case exceeded
    /// Toutes les séries atteignent exactement l'objectif.
    case met
    /// Au moins une série est en dessous de l'objectif (ou il manque des séries).
    case missed
    /// Pas d'objectif chiffré (première séance).
    case noTarget
}

/// Double progression : +1 répétition par série à chaque séance ;
/// quand toutes les séries atteignent le haut de la fourchette, on monte la charge.
public enum ProgressionEngine {
    /// Nombre de séances sans progrès à partir duquel on signale une stagnation.
    public static let stallThreshold = 3

    /// Calcule l'objectif de la prochaine séance.
    /// - Parameter history: les performances passées de l'exercice, triées de la plus ancienne à la plus récente.
    public static func recommend(for exercise: Exercise, history: [ExerciseRecord]) -> Recommendation {
        let setCount = max(1, exercise.targetSets)
        let range = exercise.repRange
        let increment = max(0, exercise.weightIncrement)
        let performed = history.filter { !$0.log.sets.isEmpty }

        guard let last = performed.last else {
            return Recommendation(
                kind: .firstSession,
                targets: Array(repeating: SetTarget(reps: range.lower, weight: nil), count: setCount),
                repRange: range,
                weightIncrement: increment,
                lastPerformance: nil,
                sessionsWithoutProgress: 0
            )
        }

        let previous = aligned(last.log.sets, to: setCount)
        let didAllSets = last.log.sets.count >= setCount
        let reachedTop = increment > 0 && didAllSets && previous.allSatisfy { $0.reps >= range.upper }

        let kind: Recommendation.Kind
        let targets: [SetTarget]
        if reachedTop {
            let from = previous.map(\.weight).max() ?? 0
            kind = .increaseWeight(from: from, to: rounded(from + increment))
            targets = previous.map { SetTarget(reps: range.lower, weight: rounded($0.weight + increment)) }
        } else {
            kind = .addReps
            targets = previous.map { set in
                // Sans incrément de charge, la progression en répétitions n'a pas de plafond.
                let reps = increment > 0 ? min(set.reps + 1, range.upper) : set.reps + 1
                return SetTarget(reps: max(reps, 1), weight: set.weight)
            }
        }

        return Recommendation(
            kind: kind,
            targets: targets,
            repRange: range,
            weightIncrement: increment,
            lastPerformance: last,
            sessionsWithoutProgress: sessionsWithoutProgress(performed)
        )
    }

    /// Compare les séries réalisées à l'objectif fixé.
    public static func evaluate(_ sets: [SetLog], against recommendation: Recommendation) -> TargetOutcome {
        if case .firstSession = recommendation.kind { return .noTarget }
        let targets = recommendation.targets
        guard !targets.isEmpty else { return .noTarget }
        guard sets.count >= targets.count else { return .missed }

        var exceeded = false
        for (set, target) in zip(sets, targets) {
            let targetWeight = target.weight ?? 0
            if set.reps < target.reps || set.weight < targetWeight - weightTolerance {
                return .missed
            }
            if set.reps > target.reps || set.weight > targetWeight + weightTolerance {
                exceeded = true
            }
        }
        return exceeded ? .exceeded : .met
    }

    /// Nombre de séances consécutives, en partant de la plus récente, qui ne battent pas la précédente.
    public static func sessionsWithoutProgress(_ history: [ExerciseRecord]) -> Int {
        var count = 0
        var index = history.count - 1
        while index > 0 {
            if isImprovement(history[index].log, over: history[index - 1].log) { break }
            count += 1
            index -= 1
        }
        return count
    }

    /// Progrès = charge max plus élevée, ou même charge max avec plus de répétitions au total.
    public static func isImprovement(_ current: ExerciseLog, over previous: ExerciseLog) -> Bool {
        let currentTop = current.topWeight
        let previousTop = previous.topWeight
        if abs(currentTop - previousTop) > weightTolerance {
            return currentTop > previousTop
        }
        return current.totalReps > previous.totalReps
    }

    // MARK: - Helpers

    static let weightTolerance = 0.001

    /// Ramène la liste des séries réalisées au nombre de séries prévues :
    /// les séries en trop sont ignorées, les séries manquantes reprennent la dernière série faite.
    static func aligned(_ sets: [SetLog], to count: Int) -> [SetLog] {
        guard let lastSet = sets.last else { return [] }
        if sets.count >= count { return Array(sets.prefix(count)) }
        return sets + Array(repeating: lastSet, count: count - sets.count)
    }

    /// Arrondit au centième pour éviter les erreurs de virgule flottante (60 + 2,5 + 2,5…).
    static func rounded(_ weight: Double) -> Double {
        (weight * 100).rounded() / 100
    }
}
