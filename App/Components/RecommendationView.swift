import SwiftUI
import RareCandyKit

/// Affiche l'objectif d'un exercice : conseil, objectif chiffré et dernière performance.
struct RecommendationView: View {
    let recommendation: Recommendation

    private var symbol: String {
        switch recommendation.kind {
        case .firstSession: return "sparkles"
        case .addReps: return "arrow.up.right"
        case .increaseWeight: return "arrow.up.circle.fill"
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Label(Format.adviceTitle(recommendation), systemImage: symbol)
                .font(.subheadline.bold())
                .foregroundStyle(isWeightIncrease ? Color.orange : Color.accentColor)

            Text("Objectif : \(Format.targets(recommendation.targets))")
                .font(.subheadline)

            Text(Format.adviceDetail(recommendation))
                .font(.caption)
                .foregroundStyle(.secondary)

            if let last = recommendation.lastPerformance {
                Text("Dernière fois (\(Format.date(last.date))) : \(Format.sets(last.log.sets))")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            if let warning = Format.stallWarning(recommendation) {
                Label(warning, systemImage: "exclamationmark.triangle.fill")
                    .font(.caption)
                    .foregroundStyle(.orange)
            }
        }
        .padding(.vertical, 4)
    }

    private var isWeightIncrease: Bool {
        if case .increaseWeight = recommendation.kind { return true }
        return false
    }
}
