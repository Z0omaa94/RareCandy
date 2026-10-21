import Foundation

/// Toutes les données de l'utilisateur : le programme, l'historique et la séance en cours.
/// C'est le document sauvegardé sur disque (et, plus tard, partagé avec le widget et la montre).
public struct TrainingData: Codable, Hashable, Sendable {
    public static let currentSchemaVersion = 1

    public var schemaVersion: Int
    /// Les jours du programme, dans l'ordre de la rotation.
    public var days: [TrainingDay]
    public var sessions: [WorkoutSession]
    public var activeWorkout: WorkoutDraft?

    public init(days: [TrainingDay] = [], sessions: [WorkoutSession] = [], activeWorkout: WorkoutDraft? = nil) {
        schemaVersion = Self.currentSchemaVersion
        self.days = days
        self.sessions = sessions
        self.activeWorkout = activeWorkout
    }
}

// MARK: - Lecture

extension TrainingData {
    public func day(withID id: UUID) -> TrainingDay? {
        days.first { $0.id == id }
    }

    public func exercise(withID id: UUID) -> Exercise? {
        for day in days {
            if let exercise = day.exercises.first(where: { $0.id == id }) { return exercise }
        }
        return nil
    }

    /// Les séances de la plus ancienne à la plus récente
    /// (à date égale, l'ordre d'enregistrement est conservé).
    public var sessionsByDate: [WorkoutSession] {
        sessions.enumerated()
            .sorted { lhs, rhs in
                lhs.element.date != rhs.element.date
                    ? lhs.element.date < rhs.element.date
                    : lhs.offset < rhs.offset
            }
            .map(\.element)
    }

    public var lastSession: WorkoutSession? { sessionsByDate.last }

    /// L'historique d'un exercice, du plus ancien au plus récent.
    public func history(forExercise exerciseID: UUID) -> [ExerciseRecord] {
        sessionsByDate.flatMap { session in
            session.exercises
                .filter { $0.exerciseID == exerciseID }
                .map { ExerciseRecord(sessionID: session.id, date: session.date, log: $0) }
        }
    }

    public func recommendation(for exercise: Exercise) -> Recommendation {
        ProgressionEngine.recommend(for: exercise, history: history(forExercise: exercise.id))
    }

    public func progress(forExercise exerciseID: UUID) -> [ProgressPoint] {
        history(forExercise: exerciseID).map(ProgressPoint.init(record:))
    }

    /// Le jour qui suit celui de la dernière séance dans la rotation (Jour 1 si aucune séance).
    public func nextDay() -> TrainingDay? {
        guard !days.isEmpty else { return nil }
        guard let last = lastSession,
              let index = days.firstIndex(where: { $0.id == last.dayID })
        else { return days.first }
        return days[(index + 1) % days.count]
    }

    public func lastSessionDate(forDay dayID: UUID) -> Date? {
        sessions.filter { $0.dayID == dayID }.map(\.date).max()
    }
}

// MARK: - Séance

extension TrainingData {
    /// Démarre une séance pour un jour du programme, pré-remplie avec les objectifs.
    /// Remplace la séance en cours s'il y en a une.
    @discardableResult
    public mutating func startWorkout(dayID: UUID, at date: Date = Date()) -> WorkoutDraft? {
        guard let day = day(withID: dayID) else { return nil }
        let exercises = day.exercises.map { exercise in
            DraftExercise(exercise: exercise, recommendation: recommendation(for: exercise))
        }
        let draft = WorkoutDraft(dayID: day.id, dayName: day.name, startedAt: date, exercises: exercises)
        activeWorkout = draft
        return draft
    }

    /// Enregistre la séance en cours (seulement les séries validées) et renvoie le bilan.
    /// Renvoie `nil` sans rien modifier s'il n'y a pas de séance ou aucune série validée.
    @discardableResult
    public mutating func finishWorkout() -> WorkoutSummary? {
        guard let draft = activeWorkout else { return nil }

        let performed = draft.exercises.compactMap { exercise -> (DraftExercise, ExerciseLog)? in
            let sets = exercise.completedSets
            guard !sets.isEmpty else { return nil }
            return (exercise, ExerciseLog(exerciseID: exercise.exerciseID, exerciseName: exercise.name, sets: sets))
        }
        guard !performed.isEmpty else { return nil }

        let previousBests = Dictionary(
            performed.map { exercise, _ in
                (exercise.exerciseID, history(forExercise: exercise.exerciseID).map(\.log.bestEstimatedOneRepMax).max())
            },
            uniquingKeysWith: { first, _ in first }
        )

        let session = WorkoutSession(
            id: draft.id,
            dayID: draft.dayID,
            dayName: draft.dayName,
            date: draft.startedAt,
            exercises: performed.map(\.1)
        )
        sessions.append(session)
        activeWorkout = nil

        let summaries = performed.map { exercise, log in
            let best = log.bestEstimatedOneRepMax
            let previousBest = previousBests[exercise.exerciseID] ?? nil
            return ExerciseSummary(
                exerciseID: exercise.exerciseID,
                name: exercise.name,
                performed: log.sets,
                target: exercise.recommendation,
                outcome: ProgressionEngine.evaluate(log.sets, against: exercise.recommendation),
                isPersonalRecord: previousBest.map { best > $0 + ProgressionEngine.weightTolerance } ?? false,
                next: self.exercise(withID: exercise.exerciseID).map { recommendation(for: $0) }
            )
        }
        return WorkoutSummary(session: session, exercises: summaries)
    }

    public mutating func discardWorkout() {
        activeWorkout = nil
    }

    public mutating func deleteSessions(ids: Set<UUID>) {
        sessions.removeAll { ids.contains($0.id) }
    }
}

// MARK: - Programme

extension TrainingData {
    @discardableResult
    public mutating func addDay(named name: String) -> TrainingDay {
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        let day = TrainingDay(name: trimmed.isEmpty ? "Jour \(days.count + 1)" : trimmed)
        days.append(day)
        return day
    }

    /// Supprime un jour du programme. L'historique des séances est conservé.
    public mutating func deleteDays(ids: Set<UUID>) {
        days.removeAll { ids.contains($0.id) }
    }
}

extension TrainingDay {
    /// Remplace l'exercice ayant le même `id`, ou l'ajoute à la fin.
    public mutating func upsert(_ exercise: Exercise) {
        if let index = exercises.firstIndex(where: { $0.id == exercise.id }) {
            exercises[index] = exercise
        } else {
            exercises.append(exercise)
        }
    }
}
