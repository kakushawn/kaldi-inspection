import os
import pickle
import numpy as np
import bob.learn.em
import scipy.io.wavfile
import python_speech_features
from bob.io.base import HDF5File
import bob.bio.gmm.algorithm.IVector as IVector


class NS:
    #THRESHOLD = 0.330178
    THRESHOLD = 0.400000
    NUMBER_OF_ENROLLMENT = 2
    FRAME_SIZE, OVERLAP, SAMPLE_RATE, NFFT = 1024, 512, 44100, 1024
    PREFIX_PATH = '/usr/local/share/NS'

    def __init__(self):
        self._iv = IVector(
            number_of_gaussians=128,
            subspace_dimension_of_t=300,
            lda_dim=50,
            use_lda=True,
            use_plda=True,
        )
        self._iv.use_lda = False
        self._iv.use_plda = False
        self._iv.load_projector('%s/iv' % NS.PREFIX_PATH)
        self._cmvn = self._load('%s/cmvn' % NS.PREFIX_PATH)

    def _do_cmvn(self, mfccs):
        return (mfccs - self._cmvn['m']) / self._cmvn['v']

    def _project(self, mfccs):
        return self._iv.project(np.array(mfccs))

    def _enroll(self, account, mfccs):
        temp_ivectors = []
        for i in range(len(mfccs)):
            temp_ivectors.append(self._project(mfccs[i]))
        average_ivector = np.mean(np.vstack(temp_ivectors), axis=0)
        if self._iv.use_plda:
            plda_machine = bob.learn.em.PLDAMachine(self._iv.plda_base)
            self._iv.plda_trainer.enroll(plda_machine, average_ivector.reshape(1, -1))
            plda_machine.save(HDF5File('%s/clients/%s' % (NS.PREFIX_PATH, account), 'w'))
        else:
            self._save(average_ivector, '%s/clients/%s' % (NS.PREFIX_PATH, account))

    def _verify(self, account, mfcc):
        enrollment_object = None
        try:
            if self._iv.use_plda:
                enrollment_object = bob.learn.em.PLDAMachine(self._iv.plda_base)
                enrollment_object.load(HDF5File('%s/clients/%s' % (NS.PREFIX_PATH, account), 'r'))
            else:
                enrollment_object = self._load('%s/clients/%s' % (NS.PREFIX_PATH, account))
        except Exception as e:
            raise Exception('account not found.')
        score = self._iv.score(
            enrollment_object,
            self._project(mfcc),
        )
        return score >= NS.THRESHOLD, score

    def enroll(self, account, filepaths, sequences):
        mfccs = []
        for i in range(NS.NUMBER_OF_ENROLLMENT):
            mfccs.append(self._do_cmvn(self._get_mfcc(filepaths[i])))
        # TODO sequence check
        return self._enroll(account, mfccs)

    def verify(self, account, filepath, sequence):
        mfcc = self._do_cmvn(self._get_mfcc(filepath))
        # TODO sequence check
        return self._verify(account, mfcc)

    def _load(self, filepath):
        data = None
        with open(filepath, 'rb') as f:
            data = pickle.load(f)
        return data

    def _save(self, variable, filepath):
        with open(filepath, 'wb') as f:
            pickle.dump(variable, f)

    def _get_mfcc(self, filepath):
        (sample_rate, signal) = scipy.io.wavfile.read(filepath)
        mfcc = python_speech_features.mfcc(
            signal,
            nfft=NS.NFFT,
            samplerate=NS.SAMPLE_RATE,
            winlen=NS.FRAME_SIZE / NS.SAMPLE_RATE,
            winstep=(NS.FRAME_SIZE - NS.OVERLAP) / NS.SAMPLE_RATE,
            numcep=13,
            nfilt=26,
        )
        mfcc_1 = python_speech_features.delta(mfcc, 2)
        mfcc_2 = python_speech_features.delta(mfcc_1, 2)
        mfcc = np.append(mfcc, mfcc_1, axis=1)
        mfcc = np.append(mfcc, mfcc_2, axis=1)
        return mfcc
