import Foundation

/// Une série en cours de saisie pendant la séance.
public struct DraftSet: Identifiable, Codable, Hashable, Sendable {
    public var id: UUID
    public var reps: Int
    public var weight: Double
    /// Objectif affiché pour cette série (nil pour une série ajoutée en plus).
    public var target: SetTarget?
    /// Seules les séries validées sont enregistrées.
    public var isCompleted: Bool

    public init(id: UUID = UUID(), reps: Int, weight: Double, target: SetTarget? = nil, isCompleted: Bool = false) {
        self.id = id
        self.reps = reps
        self.weight = weight
        self.target = target
        self.isCompleted = isCompleted
    }
}

/// Un exercice de la séance en cours, pré-rempli avec les objectifs.
public struct DraftExercise: Identifiable, Codable, Hashable, Sendable {
    public var exerciseID: UUID
    public var name: String
    public var recommendation: Recommendation
    public var sets: [DraftSet]

    public var id: UUID { exerciseID }

    public init(exercise: Exercise, recommendation: Recommendation) {
        exerciseID = exercise.id
        name = exercise.name
        self.recommendation = recommendation
        sets = recommendation.targets.map { target in
            DraftSet(reps: target.reps, weight: target.weight ?? 0, target: target)
        }
    }

    /// Ajoute une série qui reprend les valeurs de la dernière.
    public mutating func addSet() {
        let last = sets.last
        sets.append(DraftSet(reps: last?.reps ?? recommendation.repRange.lower, weight: last?.weight ?? 0))
    }

    public var completedSets: [SetLog] {
        sets.filter(\.isCompleted).map { SetLog(reps: $0.reps, weight: $0.weight) }
    }
}

/// La séance en cours. Elle est sauvegardée en continu pour survivre à une fermeture de l'app.
public struct WorkoutDraft: Identifiable, Codable, Hashable, Sendable {
    public var id: UUID
    public var dayID: UUID
    public var dayName: String
    public var startedAt: Date
    public var exercises: [DraftExercise]

    public init(id: UUID = UUID(), dayID: UUID, dayName: String, startedAt: Date, exercises: [DraftExercise]) {
        self.id = id
        self.dayID = dayID
        self.dayName = dayName
        self.startedAt = startedAt
        self.exercises = exercises
    }

    public var completedSetCount: Int {
        exercises.reduce(0) { $0 + $1.sets.filter(\.isCompleted).count }
    }
}

/// Bilan d'un exercice à la fin d'une séance.
public struct ExerciseSummary: Identifiable, Hashable, Sendable {
    public var exerciseID: UUID
    public var name: String
    public var performed: [SetLog]
    public var target: Recommendation
    public var outcome: TargetOutcome
    /// Meilleur 1RM estimé jamais réalisé sur cet exercice.
    public var isPersonalRecord: Bool
    /// Objectif de la prochaine séance (nil si l'exercice n'est plus dans le programme).
    public var next: Recommendation?

    public var id: UUID { exerciseID }
}

/// Bilan d'une séance terminée.
public struct WorkoutSummary: Identifiable, Hashable, Sendable {
    public var session: WorkoutSession
    public var exercises: [ExerciseSummary]

    public var id: UUID { session.id }
}
