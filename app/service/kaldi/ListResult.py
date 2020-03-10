from . import CollectDecodeResult


def run(param):
    content = CollectDecodeResult.run(param)
    for utt in content['per_utt']:
        content['per_utt'][utt]['wav'] = content['wav'][utt]
    del (content['wav'])

    # if param['sort'] == 'asc':
    #     content['per_utt'] = {k: v for k, v in sorted(
    #         content['per_utt'].items(), key=lambda item: float(item[1]['wer']))}
    # else:
    #     content['per_utt'] = {k: v for k, v in sorted(
    #         content['per_utt'].items(), key=lambda item: float(-1*item[1]['wer']))}

    return content
