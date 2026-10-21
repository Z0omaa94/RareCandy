import Foundation
import Observation
import RareCandyKit

/// État de l'app : les données d'entraînement, sauvegardées automatiquement à chaque modification.
@MainActor
@Observable
final class AppModel {
    private var storage: TrainingData

    /// Message affiché si le fichier de données n'a pas pu être lu au lancement.
    var loadErrorMessage: String?

    @ObservationIgnored private let store: JSONFileStore
    @ObservationIgnored private var saveTask: Task<Void, Never>?

    /// Toute modification (y compris via un `Binding`) déclenche une sauvegarde.
    var data: TrainingData {
        get { storage }
        set {
            storage = newValue
            scheduleSave()
        }
    }

    var dataFileURL: URL { store.fileURL }

    init(store: JSONFileStore = JSONFileStore(fileURL: StorageLocation.dataFileURL())) {
        self.store = store
        do {
            storage = try store.load() ?? TrainingData()
        } catch {
            storage = TrainingData()
            // On ne doit jamais écraser des données qu'on n'arrive pas à lire.
            if let backup = try? store.moveUnreadableFileAside() {
                loadErrorMessage = "Tes données n'ont pas pu être lues. Elles ont été mises de côté dans « \(backup.lastPathComponent) »."
            } else {
                loadErrorMessage = "Tes données n'ont pas pu être lues (\(error.localizedDescription))."
            }
        }
    }

    // MARK: - Séance

    func startWorkout(day: TrainingDay) {
        data.startWorkout(dayID: day.id, at: .now)
        saveNow()
    }

    /// Enregistre la séance en cours. Renvoie `nil` si aucune série n'a été validée.
    func finishWorkout() -> WorkoutSummary? {
        guard let summary = data.finishWorkout() else { return nil }
        saveNow()
        return summary
    }

    func discardWorkout() {
        data.discardWorkout()
        saveNow()
    }

    // MARK: - Programme

    func loadSampleProgram() {
        data.days.append(contentsOf: ProgramTemplates.pushPullLegs())
    }

    // MARK: - Sauvegarde

    func saveNow() {
        saveTask?.cancel()
        saveTask = nil
        do {
            try store.save(storage)
        } catch {
            print("RareCandy: échec de la sauvegarde – \(error)")
        }
    }

    /// Regroupe les modifications rapprochées (saisie au clavier) en une seule écriture.
    private func scheduleSave() {
        saveTask?.cancel()
        saveTask = Task { [weak self] in
            try? await Task.sleep(for: .milliseconds(500))
            guard !Task.isCancelled else { return }
            self?.saveNow()
        }
    }
}

/// Emplacement du fichier de données.
///
/// Si l'App Group est configuré (nécessaire pour le widget et l'Apple Watch), le fichier
/// est rangé dans le conteneur partagé ; sinon dans le dossier Documents de l'app.
enum StorageLocation {
    static let appGroupID = "group.com.rarecandy.app"
    private static let relativePath = "RareCandy/training.json"

    static func dataFileURL() -> URL {
        let fileManager = FileManager.default
        let documents = fileManager.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let local = documents.appendingPathComponent(relativePath)

        guard let group = fileManager.containerURL(forSecurityApplicationGroupIdentifier: appGroupID) else {
            return local
        }
        let shared = group.appendingPathComponent(relativePath)
        // Migration : les données créées avant l'activation de l'App Group sont déplacées.
        if !fileManager.fileExists(atPath: shared.path), fileManager.fileExists(atPath: local.path) {
            try? fileManager.createDirectory(at: shared.deletingLastPathComponent(), withIntermediateDirectories: true)
            try? fileManager.moveItem(at: local, to: shared)
        }
        return shared
    }
}
