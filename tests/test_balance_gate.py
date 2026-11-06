"""Release evidence must be complete, current, and independently recomputed."""
import unittest,copy
from balance_gate import inspect,TYPES,RATIOS

def evidence():
    return {'version':'1.1.0','sourceDigest':'current-source','runs':1800,'checksPassed':129,
      'results':[{'type':t,'ratio':r,'runs':100,'medianActions':100} for t in sorted(TYPES) for r in sorted(RATIOS)]}

class ReleaseEvidence(unittest.TestCase):
    def test_equal_growth_passes(self):self.assertTrue(all(x['passed'] for x in inspect(evidence(),'1.1.0','current-source')))
    def test_exact_ten_percent_passes(self):
        r=evidence();r['results'][0]['medianActions']=110
        self.assertTrue(all(x['passed'] for x in inspect(r,'1.1.0','current-source')))
    def test_failed_growth_cannot_claim_success(self):
        r=evidence();r['results'][0]['medianActions']=120;r['strategies']=[{'within10Percent':True}]*3
        self.assertFalse(all(x['passed'] for x in inspect(r,'1.1.0','current-source')))
    def test_missing_condition_rejected(self):
        r=evidence();r['results'].pop()
        with self.assertRaises(ValueError):inspect(r,'1.1.0','current-source')
    def test_duplicate_condition_rejected(self):
        r=evidence();r['results'][0]=copy.deepcopy(r['results'][1])
        with self.assertRaises(ValueError):inspect(r,'1.1.0','current-source')
    def test_nonfinite_median_rejected(self):
        r=evidence();r['results'][0]['medianActions']=float('nan')
        with self.assertRaises(ValueError):inspect(r,'1.1.0','current-source')
    def test_short_sampling_rejected(self):
        r=evidence();r['results'][0]['runs']=30
        with self.assertRaises(ValueError):inspect(r,'1.1.0','current-source')
    def test_old_version_rejected(self):
        with self.assertRaises(ValueError):inspect(evidence(),'1.2.0','current-source')
    def test_source_changed_rejected(self):
        with self.assertRaises(ValueError):inspect(evidence(),'1.1.0','other-source')

if __name__=='__main__':unittest.main()
