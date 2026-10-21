import SwiftUI

struct RootView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.scenePhase) private var scenePhase

    var body: some View {
        TabView {
            TodayView()
                .tabItem { Label("Séance", systemImage: "figure.strengthtraining.traditional") }
            ProgramView()
                .tabItem { Label("Programme", systemImage: "list.bullet.rectangle") }
            HistoryView()
                .tabItem { Label("Historique", systemImage: "chart.line.uptrend.xyaxis") }
        }
        .onChange(of: scenePhase) { _, phase in
            if phase != .active { model.saveNow() }
        }
        .alert(
            "Données illisibles",
            isPresented: Binding(
                get: { model.loadErrorMessage != nil },
                set: { if !$0 { model.loadErrorMessage = nil } }
            )
        ) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(model.loadErrorMessage ?? "")
        }
    }
}
