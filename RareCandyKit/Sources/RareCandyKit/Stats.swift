import Foundation

public enum Stats {
    /// 1RM estimé (formule d'Epley). 0 si aucune charge.
    public static func estimatedOneRepMax(weight: Double, reps: Int) -> Double {
        guard weight > 0, reps > 0 else { return 0 }
        if reps == 1 { return weight }
        return weight * (1 + Double(reps) / 30)
    }
}

extension SetLog {
    public var estimatedOneRepMax: Double { Stats.estimatedOneRepMax(weight: weight, reps: reps) }
    public var volume: Double { weight * Double(reps) }
}

extension ExerciseLog {
    public var topWeight: Double { sets.map(\.weight).max() ?? 0 }
    public var totalReps: Int { sets.reduce(0) { $0 + $1.reps } }
    public var volume: Double { sets.reduce(0) { $0 + $1.volume } }
    public var bestEstimatedOneRepMax: Double { sets.map(\.estimatedOneRepMax).max() ?? 0 }
}

/// Un point de la courbe de progression d'un exercice.
public struct ProgressPoint: Identifiable, Hashable, Sendable {
    public var id: UUID
    public var date: Date
    public var topWeight: Double
    public var totalReps: Int
    public var volume: Double
    public var estimatedOneRepMax: Double

    public init(record: ExerciseRecord) {
        id = record.id
        date = record.date
        topWeight = record.log.topWeight
        totalReps = record.log.totalReps
        volume = record.log.volume
        estimatedOneRepMax = record.log.bestEstimatedOneRepMax
    }
}

/// Séries identiques consécutives regroupées, pour un affichage du type « 3 × 11 @ 60 kg ».
public struct SetGroup: Hashable, Sendable {
    public var count: Int
    public var reps: Int
    public var weight: Double?

    public init(count: Int, reps: Int, weight: Double?) {
        self.count = count
        self.reps = reps
        self.weight = weight
    }

    public static func group(_ targets: [SetTarget]) -> [SetGroup] {
        var groups: [SetGroup] = []
        for target in targets {
            if let last = groups.last, last.reps == target.reps, last.weight == target.weight {
                groups[groups.count - 1].count += 1
            } else {
                groups.append(SetGroup(count: 1, reps: target.reps, weight: target.weight))
            }
        }
        return groups
    }

    public static func group(_ sets: [SetLog]) -> [SetGroup] {
        group(sets.map { SetTarget(reps: $0.reps, weight: $0.weight) })
    }
}
