#pragma once

#include <juce_audio_basics/juce_audio_basics.h>
#include <juce_audio_processors/juce_audio_processors.h>

#include <choc_javascript.h>
#include <elem/Runtime.h>


//==============================================================================
class EffectsPluginProcessor
    : public juce::AudioProcessor,
      public juce::AudioProcessorParameter::Listener,
      private juce::AsyncUpdater
{
public:
    void createParameters(const std::vector<elem::js::Value>&parameters);

    //==============================================================================
    EffectsPluginProcessor();
    ~EffectsPluginProcessor() override;

    //==============================================================================
    juce::AudioProcessorEditor* createEditor() override;
    bool hasEditor() const override;

    //==============================================================================
    void prepareToPlay (double sampleRate, int samplesPerBlock) override;
    void releaseResources() override;

    bool isBusesLayoutSupported (const juce::AudioProcessor::BusesLayout& layouts) const override;

    void processBlock (juce::AudioBuffer<float>&, juce::MidiBuffer&) override;

    //==============================================================================
    const juce::String getName() const override;

    bool acceptsMidi() const override;
    bool producesMidi() const override;
    bool isMidiEffect() const override;
    double getTailLengthSeconds() const override;

    //==============================================================================
    int getNumPrograms() override;
    int getCurrentProgram() override;
    void setCurrentProgram (int index) override;
    const juce::String getProgramName (int index) override;
    void changeProgramName (int index, const juce::String& newName) override;

    //==============================================================================
    void getStateInformation (juce::MemoryBlock& destData) override;
    void setStateInformation (const void* data, int sizeInBytes) override;

    //==============================================================================
    /** Implement the AudioProcessorParameter::Listener interface. */
    void parameterValueChanged (int parameterIndex, float newValue) override;
    void parameterGestureChanged (int parameterIndex, bool gestureIsStarting) override;

    //==============================================================================
    /** Implement the AsyncUpdater interface. */
    void handleAsyncUpdate() override;

    //==============================================================================

    /** Internal helper for initializing the embedded JS engine. */
    void initJavaScriptEngine();

    /** Internal helper for propagating processor state changes. */
    void dispatchStateChange();

    void dispatchError(std::string const& name, std::string const& message);

private:
    std::string VIEW_STATE_PROPERTY =           "viewState";

    std::string MAIN_DSP_JS_FILE =              "dsp.main.js";

    std::string SAMPLE_RATE_PROPERTY =          "sampleRate";

    std::string NATIVE_MESSAGE_FUNCTION_NAME =  "__postNativeMessage__";

    std::string LOG_FUNCTION_NAME =             "__log__";

    std::optional<std::string> loadDspEntryFileContents() const;
    void sendJavascriptToUI(const std::string& expr) const;

    static std::string serialize(const std::string&function, const elem::js::Object&data, const juce::String&replacementChar = "%");
    static std::string serialize(const std::string&function, const choc::value::Value&data, const juce::String&replacementChar = "%");

    //==============================================================================
    std::atomic<bool> shouldInitialize { false };
    double lastKnownSampleRate = 0;
    int lastKnownBlockSize = 0;

    elem::js::Object state;
    choc::javascript::Context jsContext;

    juce::AudioBuffer<float> scratchBuffer;

    std::unique_ptr<elem::Runtime<float>> runtime;

    std::map<std::string, juce::AudioParameterFloat*> parameterMap;

    //==============================================================================
    // A simple "dirty list" abstraction here for propagating realtime parameter
    // value changes
    struct ParameterReadout {
        float value = 0;
        bool dirty = false;
    };

    std::list<std::atomic<ParameterReadout>> parameterReadouts;
    static_assert(std::atomic<ParameterReadout>::is_always_lock_free);

    //==============================================================================
    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (EffectsPluginProcessor)
};

namespace jsFunctions {
    inline auto consoleLogScript = R"shim(
(function() {
  if (typeof globalThis.console === 'undefined') {
    globalThis.console = {
      log(...args) {
        __log__('[embedded:log]', ...args);
      },
      warn(...args) {
          __log__('[embedded:warn]', ...args);
      },
      error(...args) {
          __log__('[embedded:error]', ...args);
      }
    };
  }
})();
    )shim";

    inline auto hydrateScript = R"script(
(function() {
  if (typeof globalThis.__receiveHydrationData__ !== 'function')
    return false;

  globalThis.__receiveHydrationData__(%);
  return true;
})();
)script";

    inline auto dispatchScript = R"script(
(function() {
  if (typeof globalThis.__receiveStateChange__ !== 'function')
    return false;

  globalThis.__receiveStateChange__(%);
  return true;
})();
)script";

    inline auto simpleLogScript = R"script(
(function() {
  console.log(...JSON.parse(%));
  return true;
})();
)script";

    inline auto errorScript = R"script(
(function() {
  if (typeof globalThis.__receiveError__ !== 'function')
    return false;

  let e = new Error(%);
  e.name = @;

  globalThis.__receiveError__(e);
  return true;
})();
)script";
}