// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "RareCandyKit",
    platforms: [.iOS(.v17), .watchOS(.v10), .macOS(.v14)],
    products: [
        .library(name: "RareCandyKit", targets: ["RareCandyKit"]),
    ],
    targets: [
        .target(name: "RareCandyKit"),
        .testTarget(name: "RareCandyKitTests", dependencies: ["RareCandyKit"]),
    ]
)
