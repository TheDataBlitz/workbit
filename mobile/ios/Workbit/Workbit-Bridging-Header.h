/*
 * Bridging header: React-RCTAppDelegate is Objective-C++ and CocoaPods does not always
 * expose a Swift module map for it; these imports make the factory APIs visible to Swift.
 */
#import <RCTDefaultReactNativeFactoryDelegate.h>
#import <RCTReactNativeFactory.h>
#import <React/RCTBundleURLProvider.h>
