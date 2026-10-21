import Foundation

/// Programmes d'exemple pour démarrer rapidement.
public enum ProgramTemplates {
    /// Push / Pull / Legs sur 3 jours, avec une fourchette 10–15 répétitions.
    public static func pushPullLegs() -> [TrainingDay] {
        [
            TrainingDay(name: "Pecs", exercises: [
                Exercise(name: "Développé couché", weightIncrement: 2.5),
                Exercise(name: "Développé incliné haltères", weightIncrement: 2),
                Exercise(name: "Écarté à la poulie", weightIncrement: 2.5),
                Exercise(name: "Dips", weightIncrement: 2.5),
                Exercise(name: "Extension triceps poulie", weightIncrement: 2.5),
            ]),
            TrainingDay(name: "Dos", exercises: [
                Exercise(name: "Tractions", repRange: RepRange(lower: 6, upper: 12), weightIncrement: 2.5),
                Exercise(name: "Rowing barre", weightIncrement: 2.5),
                Exercise(name: "Tirage vertical", weightIncrement: 2.5),
                Exercise(name: "Curl biceps haltères", weightIncrement: 1),
            ]),
            TrainingDay(name: "Jambes", exercises: [
                Exercise(name: "Squat", weightIncrement: 5),
                Exercise(name: "Presse à cuisses", weightIncrement: 10),
                Exercise(name: "Leg curl", weightIncrement: 2.5),
                Exercise(name: "Mollets debout", repRange: RepRange(lower: 12, upper: 20), weightIncrement: 5),
            ]),
        ]
    }
}
