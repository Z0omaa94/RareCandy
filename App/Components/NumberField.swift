import SwiftUI

/// Champ numérique qui met à jour la valeur à chaque frappe
/// (contrairement à `TextField(value:format:)` qui attend la fin de la saisie).
struct NumberField: View {
    let placeholder: String
    @Binding var value: Double
    var allowsDecimals = true

    @State private var text = ""
    @FocusState private var isFocused: Bool

    var body: some View {
        TextField(placeholder, text: $text)
            .keyboardType(allowsDecimals ? .decimalPad : .numberPad)
            .multilineTextAlignment(.trailing)
            .focused($isFocused)
            .onAppear { text = Format.number(value) }
            .onChange(of: text) { _, newText in
                guard let parsed = Format.parseNumber(newText) else { return }
                let newValue = allowsDecimals ? parsed : parsed.rounded()
                if newValue != value { value = newValue }
            }
            .onChange(of: value) { _, newValue in
                if !isFocused { text = Format.number(newValue) }
            }
            .onChange(of: isFocused) { _, focused in
                if !focused { text = Format.number(value) }
            }
    }
}

extension NumberField {
    /// Variante pour les valeurs entières (répétitions).
    init(_ placeholder: String, integer: Binding<Int>) {
        self.init(
            placeholder: placeholder,
            value: Binding(
                get: { Double(integer.wrappedValue) },
                set: { integer.wrappedValue = Int($0) }
            ),
            allowsDecimals: false
        )
    }
}
