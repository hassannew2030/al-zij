import Foundation
import CoreLocation
import Capacitor

/// Al-Zij — place names from Apple's own map service, on the iPhone (table #98, Hassan 25 Nov 2026).
/// The page used to ask OpenStreetMap / BigDataCloud for the city and district; in the app, zij-privacy.js answers those
/// requests with this plugin instead, so the coordinates go to Apple only (the system service every iPhone app uses for addresses).
/// JS: Capacitor.registerPlugin('ZijGeocoder').reverse({ lat, lon, lang }) → { city, hood, subAdmin, admin, country, countryCode }
@objc(ZijGeocoderPlugin)
public class ZijGeocoderPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "ZijGeocoderPlugin"
    public let jsName = "ZijGeocoder"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "reverse", returnType: CAPPluginReturnPromise)
    ]

    @objc func reverse(_ call: CAPPluginCall) {
        guard let lat = call.getDouble("lat"), let lon = call.getDouble("lon"),
              abs(lat) <= 90, abs(lon) <= 180 else {
            call.reject("lat and lon are required")
            return
        }
        let lang = call.getString("lang") ?? "ar"
        let place = CLLocation(latitude: lat, longitude: lon)
        // one geocoder per request: Apple allows one request at a time on each instance
        let geocoder = CLGeocoder()
        geocoder.reverseGeocodeLocation(place, preferredLocale: Locale(identifier: lang)) { marks, error in
            if let error = error {
                call.reject(error.localizedDescription)
                return
            }
            guard let p = marks?.first else {
                call.resolve([:])
                return
            }
            call.resolve([
                "city": p.locality ?? "",
                "hood": p.subLocality ?? "",
                "subAdmin": p.subAdministrativeArea ?? "",
                "admin": p.administrativeArea ?? "",
                "country": p.country ?? "",
                "countryCode": p.isoCountryCode ?? ""
            ])
        }
    }
}
