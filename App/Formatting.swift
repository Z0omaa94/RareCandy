import Foundation
import RareCandyKit

/// Textes affichés à l'utilisateur.
enum Format {
    static func number(_ value: Double) -> String {
        value.formatted(.number.grouping(.never).precision(.fractionLength(0...2)))
    }

    /// Accepte la virgule ou le point comme séparateur décimal.
    /// Refuse les valeurs négatives ou absurdes (> 10 000).
    static func parseNumber(_ text: String) -> Double? {
        let normalized = text
            .trimmingCharacters(in: .whitespaces)
            .replacingOccurrences(of: ",", with: ".")
        guard let value = Double(normalized), value.isFinite, (0...10_000).contains(value) else { return nil }
        return value
    }

    static func weight(_ value: Double) -> String {
        value > 0 ? "\(number(value)) kg" : "poids du corps"
    }

    /// « 3 × 11 @ 60 kg » ou « 2 × 11 @ 60 kg + 1 × 10 @ 60 kg ».
    static func sets(_ groups: [SetGroup]) -> String {
        groups.map { group in
            var text = "\(group.count) × \(group.reps)"
            if let weight = group.weight {
                text += " @ \(self.weight(weight))"
            }
            return text
        }
        .joined(separator: " + ")
    }

    static func targets(_ targets: [SetTarget]) -> String { sets(SetGroup.group(targets)) }
    static func sets(_ sets: [SetLog]) -> String { self.sets(SetGroup.group(sets)) }

    static func dayTitle(index: Int, name: String) -> String {
        "Jour \(index + 1) · \(name)"
    }

    static func date(_ date: Date) -> String {
        date.formatted(date: .abbreviated, time: .omitted)
    }

    static func relative(_ date: Date) -> String {
        date.formatted(.relative(presentation: .named))
    }

    // MARK: - Conseils de progression

    static func adviceTitle(_ recommendation: Recommendation) -> String {
        switch recommendation.kind {
        case .firstSession:
            return "Première séance"
        case .addReps:
            return "Objectif : +1 rep par série"
        case .increaseWeight:
            return "Monte la charge !"
        }
    }

    static func adviceDetail(_ recommendation: Recommendation) -> String {
        let range = recommendation.repRange
        switch recommendation.kind {
        case .firstSession:
            return "Choisis une charge avec laquelle tu fais \(range.lower) répétitions propres sur chaque série."
        case .addReps where recommendation.weightIncrement <= 0:
            return "Ajoute une répétition sur chaque série."
        case .addReps:
            return "Garde la même charge. Quand toutes tes séries atteindront \(range.upper) reps, l'app te dira de monter la charge."
        case let .increaseWeight(from, to):
            return "Tu as fait \(range.upper) reps sur toutes les séries. Passe de \(weight(from)) à \(weight(to)) et repars à \(range.lower) reps."
        }
    }

    static func stallWarning(_ recommendation: Recommendation) -> String? {
        guard recommendation.isStalled else { return nil }
        return "Pas de progrès depuis \(recommendation.sessionsWithoutProgress) séances : vérifie ton sommeil et ta récup, ou fais une semaine plus légère (-10 %)."
    }

    static func outcome(_ outcome: TargetOutcome) -> String {
        switch outcome {
        case .exceeded: return "Objectif dépassé"
        case .met: return "Objectif atteint"
        case .missed: return "Objectif pas atteint"
        case .noTarget: return "Première séance enregistrée"
        }
    }

    static func outcomeSymbol(_ outcome: TargetOutcome) -> String {
        switch outcome {
        case .exceeded: return "flame.fill"
        case .met: return "checkmark.circle.fill"
        case .missed: return "xmark.circle"
        case .noTarget: return "flag.checkered"
        }
    }
}
