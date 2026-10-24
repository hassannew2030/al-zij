# Adds the privacy manifest and the alert sounds to the App target, makes the app iPhone-only and sets the version.
# Called by configure-ios.sh (needs the xcodeproj gem, present on GitHub's macOS runners with CocoaPods).
require 'xcodeproj'
proj_path = File.expand_path('../ios/App/App.xcodeproj', __dir__)
project = Xcodeproj::Project.open(proj_path)
target = project.targets.find { |t| t.name == 'App' } or abort 'no App target'
group = project.main_group.find_subpath('App', false) or abort 'no App group'
files = ['PrivacyInfo.xcprivacy'] + Dir[File.expand_path('../ios/App/App/*.wav', __dir__)].map { |f| File.basename(f) }
files.each do |name|
  next if group.files.any? { |f| f.path == name }
  ref = group.new_reference(name)
  target.resources_build_phase.add_file_reference(ref, true)
end
version = ENV['ZIJ_MARKETING_VERSION'] || '1.0.0'
build = ENV['ZIJ_BUILD_NUMBER'] || '1'
target.build_configurations.each do |c|
  c.build_settings['TARGETED_DEVICE_FAMILY'] = '1'           # iPhone only: no iPad screenshots needed for review
  c.build_settings['MARKETING_VERSION'] = version
  c.build_settings['CURRENT_PROJECT_VERSION'] = build
  c.build_settings['PRODUCT_BUNDLE_IDENTIFIER'] = ENV['ZIJ_APP_ID'] || c.build_settings['PRODUCT_BUNDLE_IDENTIFIER']
end
project.save
puts "Xcode: #{files.join(', ')} in App target; iPhone only; version #{version} (#{build})"
