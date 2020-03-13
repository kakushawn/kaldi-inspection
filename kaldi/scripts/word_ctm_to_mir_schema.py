# coding=UTF-8
import sys
import argparse
import json
import os

parser = argparse.ArgumentParser()
parser.add_argument("data_dir", help="data dir")
parser.add_argument("ctm_file", help="ctm table")
parser.add_argument("dst_dir", help="destination directory")
args = parser.parse_args()

def loadData(data_dir):
    with open(data_dir+"/text", encoding="utf-8") as fp:
        lines = fp.read().splitlines()
    data = {}
    for line in lines:
        tokens = line.split()
        utt = tokens[0]
        data[utt]={ 'text':tokens[1:] }

    return data

def parseCtm(ctm_file):
    with open(ctm_file, encoding="utf-8") as fp:
        lines = fp.read().splitlines()

    ctm = {}
    for line in lines:
        (utt, c, beg, dur, word) = line.split()
        if utt not in ctm:
            ctm[utt] = []
        ctm[utt].append({
            'beg': float(beg),
            'dur': float(dur),
            'word': word,
        })

    return ctm

def writeUttSchema(dst_dir, data, ctm):
    for utt in data:
        schema = {
            "Utterance": utt,
            "text": [
                ' '.join(data[utt]['text'])
            ],
            "syl": [],
            "warningMessage": [],
            "cm": {
                "language": "Mandarin",
                "score": 0,
                "timberScore": 0,
                "word": [
                ]
            }
        }
        words = []
        for token in ctm[utt]:
            words.append({
                "name": token["word"],
                "interval": [
                    token["beg"],
                    token["beg"]+token["dur"]
                ],
                "text": token["word"],
                "timberScore": -1,
                "pitch": [],
                "volume": [],
                "timberScores": [],
                "syl": [
                    {
                        "name": token["word"] if token["word"] != "<eps>" else "SIL",
                        "text": token["word"] if token["word"] != "<eps>" else "",
                        "mispro": "",
                        "sylCount": 0,
                        "interval": [
                            token["beg"],
                            token["beg"]+token["dur"]
                        ],
                        "timberScore": -1,
                        "pitch": [],
                        "volume": [],
                        "timberScores": [],
                        "phone": [
                            {
                                "name": "", #token["word"],
                                "index": -1,
                                "interval": [
                                    token["beg"],
                                    token["beg"]+token["dur"]
                                ],
                                "timberScore": "", #-1,
                                "pitched": 0,
                                "pitch": [],
                                "volume": [],
                                "cumLogLike": 0,
                                "rankRatio": [
                                    -1
                                ],
                                "timeRatio": -1,
                                "competingModelIndex": -1,
                                "competingModelName": [
                                    "NaN"
                                ],
                                "competingModelLogLike": -1,
                                "GOP": [
                                    -1
                                ],
                                "timberScores": [],
                                "diagnosis": ""
                            }
                        ],
                        "linking": False
                    }
                ]
            })

        schema["cm"]["word"] = words
        content = json.dumps(schema, ensure_ascii=False)

        with open(dst_dir+"/"+utt+".json", "w", encoding="utf-8") as fp:
            fp.write(content)

def main():
    global args

    ctm = parseCtm(args.ctm_file)
    data = loadData(args.data_dir)

    [ sys.stderr.write("ctm of utt:"+utt+" is not in data") for utt in ctm if utt not in data]
    [ sys.stderr.write("data of utt:"+utt+" is not in ctm") for utt in data if utt not in ctm]

    if not os.path.exists(args.dst_dir):
        os.mkdir(args.dst_dir)
    writeUttSchema(args.dst_dir, data, ctm)

if __name__ == "__main__":
    main()