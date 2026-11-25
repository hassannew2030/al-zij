import UIKit
import Capacitor

/// Al-Zij — the app's own bridge view controller. It only registers the plugins that live inside the app (not on npm).
/// configure-ios.sh points Main.storyboard at this class instead of Capacitor's CAPBridgeViewController.
class ZijViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(ZijGeocoderPlugin())
    }
}
