#import <React/RCTBridgeModule.h>

// Espone la classe Swift VoiceGuideForeground come modulo nativo RN,
// speculare a "VoiceGuideForeground" registrato via autolinking su Android.
@interface RCT_EXTERN_MODULE(VoiceGuideForeground, NSObject)

RCT_EXTERN_METHOD(startService:(NSString *)title message:(NSString *)message)
RCT_EXTERN_METHOD(startGuideBroadcast:(NSString *)channelName token:(NSString *)token)
RCT_EXTERN_METHOD(startGuestListening:(NSString *)channelName token:(NSString *)token)
RCT_EXTERN_METHOD(stopService)

@end
