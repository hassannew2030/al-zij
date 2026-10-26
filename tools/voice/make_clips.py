"""Generate Al-Zij talking-clock clips with the open-source Piper voice ar_JO-kareem (offline once downloaded).
Usage: python tools/voice/make_clips.py MODEL.onnx OUTDIR"""
import sys, os, wave, json
sys.path.insert(0, os.path.dirname(__file__))
from phrases import P
from piper import PiperVoice
model, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
v = PiperVoice.load(model)
def synth(text, path):
    with wave.open(path, 'wb') as w:
        try:
            from piper import SynthesisConfig
            v.synthesize_wav(text, w, syn_config=SynthesisConfig(length_scale=1.1))
        except Exception:
            try: v.synthesize_wav(text, w)
            except AttributeError: v.synthesize(text, w, length_scale=1.1)
for k, t in P.items():
    synth(t, os.path.join(out, k + '.wav'))
# full samples to judge quality
S = {
 'sample_noon': 'السّاعَةُ الآنَ الثّانِيَةَ عَشْرَةَ ظُهْرًا. اليَوْمَ الاثْنَيْن، الخامِسَ عَشَرَ مِنْ جُمادى الأُولى، سَنَةَ أَلْفٍ وأَرْبَعِمِئَةٍ وثَمانِيَةٍ وأَرْبَعِين لِلهِجْرَة. المُوافِق السّادِسُ والعِشْرُون مِنْ أُكْتُوبَر، سَنَةَ أَلْفَيْن وسِتَّةٍ وعِشْرِين مِيلادِيّ.',
 'sample_newday': 'بِسْمِ اللهِ. بَدَأَ يَوْمٌ جَدِيد. اليَوْمَ الثُّلاثاء، السّادِسَ عَشَرَ مِنْ جُمادى الأُولى. السّاعَةُ الآنَ الثّانِيَةَ عَشْرَةَ لَيْلًا.'}
for k, t in S.items(): synth(t, os.path.join(out, k + '.wav'))
json.dump(P, open(os.path.join(out, 'phrases.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print('clips', len(P) + len(S))
