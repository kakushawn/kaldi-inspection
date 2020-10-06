from flask import current_app as app
import os
import sys
import json


def _getAudioPosInScp(line0):
    tokens = line0.split()
    if len(tokens) == 2:
        return 1
    # assuming ext naming are  3 chars len :(
    for i, token in enumerate(tokens):
        if len(token) > 4 and token[-4] == '.':
            return i
    return -1


def _checkConsistency(content):
    if len(content['utts']) != len(content['wav']):
        return False
    for utt in content['utts']:
        if utt not in content['wav']:
            return False
    for utt in content['wav']:
        if utt not in content['utts']:
            return False
    return True


def _getWer(csid):
    errs = float(csid[1]) + float(csid[2]) + float(csid[3])
    occs = float(csid[0]) + float(csid[1]) + float(csid[3])
    if occs == 0.0:
        return 0
    return errs/occs


def fetchPerUtt(param):
    content = {'utts': {}}
    decode_dir = param['decode_id']
    if decode_dir in os.listdir(app.config['DECODES_FOLDER']):
        scoring_dir = app.config['DECODES_FOLDER'] + "/" + decode_dir + \
            '/scoring_kaldi/'
        
        print( scoring_dir + param['criterion'] + '_details' )
        if not os.path.exists(scoring_dir + param['criterion'] + '_details'):
            return {"error": "criterion details not exist!"}
        per_utt = scoring_dir + param['criterion'] + '_details' + '/per_utt'

        # read per utt
        count = 0
        with open(per_utt, "r", encoding="utf-8") as fp:
            lines = fp.read().splitlines()
        for line in lines:
            tokens = line.split()
            if count == 0:
                content['utts'][tokens[0]] = {}
            if count == 3:
                content['utts'][tokens[0]]["csid"] = tokens[2:]
                content['utts'][tokens[0]]['wer'] = _getWer(tokens[2:])
                content['utts'][tokens[0]]['ctm_link'] = "/ctm/?decode_id=" + \
                    param['decode_id']+"&uttid="+tokens[0]
                count = -1
            else:
                content['utts'][tokens[0]][tokens[1]] = tokens[2:]
            count += 1

        # read overall wer
        wer_file = scoring_dir + "/best_" + param['criterion'].lower()
        if not os.path.exists(wer_file):
            return {"error": "wer file not exist!"}
        with open(wer_file, "r", encoding="utf-8") as fp:
            lines = fp.read().splitlines()
        tokens = lines[0].split()
        content['wer'] = tokens[1]

    else:
        return {"error": "decode_dir not exist!"}

    return content


def fetchCtm(param):
    uttid = param["uttid"]
    # get mir ctm
    expdir = app.config['DECODES_FOLDER']
    decode_dir = expdir+"/"+param['decode_id']
    mir_ctm_file = decode_dir + "/mir/"+param['uttid']+'.json'
    if not os.path.exists(mir_ctm_file):
        return {"error": "ctm json file not exist!"}
    with open(mir_ctm_file , "r", encoding="utf-8") as fp:
        ctm = json.load(fp)

    # get corpus name
    corpus_file = decode_dir+"/corpus"
    with open(corpus_file, "r", encoding="utf-8") as fp:
        lines = fp.read().splitlines()
    if len(lines) != 1:
        return {"error": "corpus file no data!"}
    corpus = lines[0]

    # get wav path
    wavscp = decode_dir + "/data/wav.scp"
    if not os.path.exists(wavscp):
        return {"error": "data wav.scp not exist!"}
    with open(wavscp, "r", encoding="utf-8") as fp:
        lines = fp.read().splitlines()
    if len(lines) == 0:
        return {'error': "read wav.scp error!"}

    # find audio position in wav.scp
    tokens = lines[0].split()
    audio_file_pos = _getAudioPosInScp(lines[0])
    if audio_file_pos < 1:
        return {'erroe':"audio_file_pos < 1!"}

    # get wav id if segments exist
    segments = decode_dir + "/data/segments"
    segmentsTimes = None
    if os.path.exists( segments ):
        with open(segments, "r", encoding="utf-8") as fp :
            for segment in fp.read().splitlines() :
                tokens = segment.split()
                if tokens[0] == uttid:
                    uttid = tokens[1]
                    segmentsTimes = [tokens[2], tokens[3]]
                    break;

    # find wav of given utt in wav.scp
    wav_relative_path = ""
    for line in lines:
        tokens = line.split()
        if tokens[0] == uttid:
            wav_tokens = tokens[audio_file_pos].split(corpus+"/")
            if len(wav_tokens) != 2:
                return {'error':"wav token error!!! Corpus: "+corpus+", File_pos: "+str(audio_file_pos)+", Wav_tokens: ["+",".join(tokens)+"]"}
            wav_relative_path = "/static/dataset/" + \
                corpus + "/" + wav_tokens[1]

    # utt not found
    if wav_relative_path == "":
        return {'error':"utt not found in wav.scp! uttid: "+uttid}

    return {
        'ctm': ctm,
        'audio': {'wav': wav_relative_path, 'segments': segmentsTimes},
        'wav': wav_relative_path,
        'segments': segmentsTimes
    }


def getDecodes():
    return sorted([d for d in os.listdir(app.config['DECODES_FOLDER'])
            if os.path.islink(app.config['DECODES_FOLDER']+"/"+d)
            or os.path.isdir(app.config['DECODES_FOLDER']+"/"+d)])
