import Foundation

/// Fourchette de répétitions utilisée par la double progression (ex. 10...15).
///
/// On ajoute une répétition par série à chaque séance jusqu'à `upper`,
/// puis on monte la charge et on repart à `lower`.
public struct RepRange: Codable, Hashable, Sendable {
    public var lower: Int
    public var upper: Int

    public init(lower: Int, upper: Int) {
        self.lower = max(1, min(lower, upper))
        self.upper = max(self.lower, upper)
    }

    public static let `default` = RepRange(lower: 10, upper: 15)

    /// Change le minimum en gardant `lower <= upper`.
    public mutating func setLower(_ value: Int) {
        lower = max(1, value)
        if upper < lower { upper = lower }
    }

    /// Change le maximum en gardant `lower <= upper`.
    public mutating func setUpper(_ value: Int) {
        upper = max(1, value)
        if lower > upper { lower = upper }
    }
}

/// Un exercice prévu dans un jour d'entraînement.
///
/// L'historique (et donc la progression) est rattaché à l'`id` de l'exercice :
/// le même nom dans deux jours différents correspond à deux progressions distinctes.
public struct Exercise: Identifiable, Codable, Hashable, Sendable {
    public var id: UUID
    public var name: String
    public var targetSets: Int
    public var repRange: RepRange
    /// Charge ajoutée (en kg) quand toutes les séries atteignent `repRange.upper`.
    /// 0 = progression uniquement en répétitions, sans plafond.
    public var weightIncrement: Double
    public var notes: String

    public init(
        id: UUID = UUID(),
        name: String,
        targetSets: Int = 3,
        repRange: RepRange = .default,
        weightIncrement: Double = 2.5,
        notes: String = ""
    ) {
        self.id = id
        self.name = name
        self.targetSets = targetSets
        self.repRange = repRange
        self.weightIncrement = weightIncrement
        self.notes = notes
    }
}

/// Un jour du programme (ex. « Pecs »). L'ordre des jours dans le programme
/// définit la rotation : Jour 1, Jour 2, … puis retour au Jour 1.
public struct TrainingDay: Identifiable, Codable, Hashable, Sendable {
    public var id: UUID
    public var name: String
    public var exercises: [Exercise]

    public init(id: UUID = UUID(), name: String, exercises: [Exercise] = []) {
        self.id = id
        self.name = name
        self.exercises = exercises
    }
}

/// Une série réalisée. `weight` est en kg ; 0 = poids du corps.
public struct SetLog: Codable, Hashable, Sendable {
    public var reps: Int
    public var weight: Double

    public init(reps: Int, weight: Double) {
        self.reps = reps
        self.weight = weight
    }
}

/// Les séries réalisées pour un exercice pendant une séance.
public struct ExerciseLog: Identifiable, Codable, Hashable, Sendable {
    public var id: UUID
    public var exerciseID: UUID
    /// Nom au moment de la séance, pour garder un historique lisible
    /// même si l'exercice est renommé ou supprimé du programme.
    public var exerciseName: String
    public var sets: [SetLog]

    public init(id: UUID = UUID(), exerciseID: UUID, exerciseName: String, sets: [SetLog]) {
        self.id = id
        self.exerciseID = exerciseID
        self.exerciseName = exerciseName
        self.sets = sets
    }
}

/// Une séance terminée et enregistrée.
public struct WorkoutSession: Identifiable, Codable, Hashable, Sendable {
    public var id: UUID
    public var dayID: UUID
    public var dayName: String
    public var date: Date
    public var exercises: [ExerciseLog]
    public var notes: String

    public init(
        id: UUID = UUID(),
        dayID: UUID,
        dayName: String,
        date: Date,
        exercises: [ExerciseLog],
        notes: String = ""
    ) {
        self.id = id
        self.dayID = dayID
        self.dayName = dayName
        self.date = date
        self.exercises = exercises
        self.notes = notes
    }
}

/// Une performance passée sur un exercice, avec la date de la séance.
public struct ExerciseRecord: Identifiable, Codable, Hashable, Sendable {
    public var sessionID: UUID
    public var date: Date
    public var log: ExerciseLog

    public var id: UUID { log.id }

    public init(sessionID: UUID, date: Date, log: ExerciseLog) {
        self.sessionID = sessionID
        self.date = date
        self.log = log
    }
}
