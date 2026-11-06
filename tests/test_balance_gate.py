"""Release evidence must be complete, current, and independently recomputed."""
import unittest,copy
from balance_gate import inspect,inspect_validation,TYPES,RATIOS

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

def validation_evidence():
    base=evidence();out={'version':'1.1.0','sourceDigest':'current-source','totalRuns':7500,'runsPerCondition':100,'cases':{},'wholeGrowth':[]}
    for name in ['held_out','state_aware','stressed','first_growth','first_growth_held_out']:
        types={'garden_keeper','star_scholar','workshop_artisan'} if name.startswith('first_growth') else TYPES
        out['cases'][name]={'results':[r for r in copy.deepcopy(base['results']) if r['type'] in types]}
    for ratio,f,s,t in [(.4,'easy','garden_keeper','life_gardener'),(.5,'genius','star_scholar','galaxy_archivist'),(.6,'diligent','steel_guardian','royal_captain')]:
        out['wholeGrowth'].append({'ratio':ratio,'runs':100,'completed':100,'firstTypes':{f:100},'secondTypes':{s:100},'thirdTypes':{t:100}})
    return out

class IndependentGrowthEvidence(unittest.TestCase):
    def test_complete_evidence_passes(self):self.assertTrue(all(g['passed'] for rows in inspect_validation(validation_evidence(),'1.1.0','current-source').values() for g in rows))
    def test_bad_prior_growth_blocks(self):
        r=validation_evidence();r['cases']['first_growth']['results'][0]['medianActions']=120
        self.assertFalse(all(g['passed'] for rows in inspect_validation(r,'1.1.0','current-source').values() for g in rows))
    def test_missing_held_out_blocks(self):
        r=validation_evidence();del r['cases']['held_out']
        with self.assertRaises(ValueError):inspect_validation(r,'1.1.0','current-source')
    def test_missing_natural_growth_blocks(self):
        r=validation_evidence();r['wholeGrowth'].pop()
        with self.assertRaises(ValueError):inspect_validation(r,'1.1.0','current-source')
    def test_failed_natural_growth_blocks(self):
        r=validation_evidence();r['wholeGrowth'][0]['completed']=99
        with self.assertRaises(ValueError):inspect_validation(r,'1.1.0','current-source')
    def test_stale_source_blocks_independent_evidence(self):
        with self.assertRaises(ValueError):inspect_validation(validation_evidence(),'1.1.0','different-source')
    def test_malformed_case_blocks(self):
        r=validation_evidence();r['cases']['held_out']=None
        with self.assertRaises(ValueError):inspect_validation(r,'1.1.0','current-source')

if __name__=='__main__':unittest.main()
