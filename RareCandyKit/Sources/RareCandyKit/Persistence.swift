import Foundation

public enum PersistenceError: Error, Equatable {
    /// Le fichier a été écrit par une version plus récente de l'app.
    case unsupportedSchemaVersion(Int)
}

/// Sauvegarde les données dans un fichier JSON.
///
/// Un simple fichier suffit pour un usage perso et se partage facilement
/// avec un widget ou une app Apple Watch via un App Group.
public struct JSONFileStore: Sendable {
    public let fileURL: URL

    public init(fileURL: URL) {
        self.fileURL = fileURL
    }

    /// Renvoie `nil` si aucun fichier n'existe encore.
    public func load() throws -> TrainingData? {
        guard FileManager.default.fileExists(atPath: fileURL.path) else { return nil }
        let raw = try Data(contentsOf: fileURL)
        let data = try Self.makeDecoder().decode(TrainingData.self, from: raw)
        guard data.schemaVersion <= TrainingData.currentSchemaVersion else {
            throw PersistenceError.unsupportedSchemaVersion(data.schemaVersion)
        }
        return data
    }

    public func save(_ data: TrainingData) throws {
        try FileManager.default.createDirectory(
            at: fileURL.deletingLastPathComponent(),
            withIntermediateDirectories: true
        )
        let raw = try Self.makeEncoder().encode(data)
        try raw.write(to: fileURL, options: .atomic)
    }

    /// Renomme un fichier illisible pour ne jamais l'écraser, et renvoie son nouvel emplacement.
    @discardableResult
    public func moveUnreadableFileAside(now: Date = Date()) throws -> URL {
        let stamp = Int(now.timeIntervalSince1970)
        let name = fileURL.deletingPathExtension().lastPathComponent
        let backup = fileURL.deletingLastPathComponent()
            .appendingPathComponent("\(name)-illisible-\(stamp).json")
        try FileManager.default.moveItem(at: fileURL, to: backup)
        return backup
    }

    public static func makeEncoder() -> JSONEncoder {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        return encoder
    }

    public static func makeDecoder() -> JSONDecoder {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return decoder
    }
}
