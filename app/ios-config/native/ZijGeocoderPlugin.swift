import Foundation
import UIKit
import CoreLocation
import Capacitor

/// Al-Zij — place names from Apple's own map service, on the iPhone (table #98, Hassan 25 Nov 2026).
/// The page used to ask OpenStreetMap / BigDataCloud for the city and district; in the app, zij-privacy.js answers those
/// requests with this plugin instead, so the coordinates go to Apple only (the system service every iPhone app uses for addresses).
/// JS: Capacitor.registerPlugin('ZijGeocoder').reverse({ lat, lon, lang }) → { city, hood, subAdmin, admin, country, countryCode }
///     .forward({ q, lang }) → { results: [{ name, city, admin, country, countryCode, lat, lon, tz }] }   (a city by name, 25 Nov, option أ)
///     .openSettings()       → opens the app's own page in the iPhone's Settings («اسمح بالموقع»)
@objc(ZijGeocoderPlugin)
public class ZijGeocoderPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "ZijGeocoderPlugin"
    public let jsName = "ZijGeocoder"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "reverse", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "forward", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openSettings", returnType: CAPPluginReturnPromise)
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

    /// A city by its name, from Apple's map service — instead of Open-Meteo's city search, so no third party sees what is typed.
    @objc func forward(_ call: CAPPluginCall) {
        let q = (call.getString("q") ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        guard q.count >= 2 else {
            call.resolve(["results": [] as [Any]])
            return
        }
        let lang = call.getString("lang") ?? "ar"
        let geocoder = CLGeocoder()
        geocoder.geocodeAddressString(q, in: nil, preferredLocale: Locale(identifier: lang)) { marks, error in
            if let e = error as? CLError, e.code == .geocodeFoundNoResult {
                call.resolve(["results": [] as [Any]])
                return
            }
            if let error = error {
                call.reject(error.localizedDescription)
                return
            }
            var out: [[String: Any]] = []
            for p in marks ?? [] {
                guard let loc = p.location else { continue }
                out.append([
                    "name": p.name ?? p.locality ?? "",
                    "city": p.locality ?? "",
                    "admin": p.administrativeArea ?? "",
                    "country": p.country ?? "",
                    "countryCode": p.isoCountryCode ?? "",
                    "lat": loc.coordinate.latitude,
                    "lon": loc.coordinate.longitude,
                    "tz": p.timeZone?.identifier ?? ""
                ])
            }
            call.resolve(["results": out])
        }
    }

    /// «اسمح بالموقع»: the app's own page in Settings, where Location can be turned on.
    @objc func openSettings(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let url = URL(string: UIApplication.openSettingsURLString) else {
                call.reject("no Settings address")
                return
            }
            UIApplication.shared.open(url, options: [:]) { ok in
                if ok { call.resolve() } else { call.reject("Settings did not open") }
            }
        }
    }
}
