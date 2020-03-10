from . import main
from flask import request, jsonify, redirect
from flask import send_from_directory  # , current_app
from flask import render_template
# import time
# import uuid
# from hanziconv import HanziConv
# from . import log_class
from ..service import kaldi
# import os


@main.route('/', methods=['GET'])
def main_portal():
    return redirect('/static/demo.html', code=302)


# @main.route('/dataset/<path>')
# def resource(path):
#     print("!!!!!!!!!!!!!!!!!!!!!!!! " + path)
#     return send_from_directory('dataset', path)


@main.route('/kaldi/list', methods=['GET'])
def listResult():
    param = {
        'decode_id': request.args.get('decode_id'),
        'data': request.args.get('data'),
        'criterion': request.args.get('criterion', 'wer'),
        'sort': request.args.get('sort', default='des')
    }
    if param['decode_id'] is None \
            or param['data'] is None \
            or param['sort'] not in ['des', 'asc']\
            or param['criterion'] not in ['wer', 'cer']:
        return jsonify(
            success=False,
            message="invalid params",
            content=None
        )
    content = kaldi.showDecode(param)
    if content is None:
        success = False
        message = "decode id or data does not exist"
    else:
        success = True
        message = ""
    return jsonify(
        success=success,
        message=message,
        content=content
    )
    # return "---------------------"


def _validateDetailParam():
    uttid = request.values.get('uttid')
    wav_reqsource = request.values.get('wav_resource')
    if uttid == None:
        return "uttid is empty"
    if wav_reqsource == None:
        return "wav_resource is empty"
    if request.files('ctm1') == None:
        return "no any ctm there"
    ctms = [request.files('ctm1')]
    if request.files('ctm2') == None:
        ctms.append(request.files('ctm2'))
    if request.files('ctm3') == None:
        ctms.append(request.files('ctm3'))
    return {
        'uttid': uttid,
        'wav_resource': wav_reqsource,
        'ctms': ctms
    }


@main.route('/kaldi/detail', methods=['GET', 'POST'])
def detail():
    if request.method == 'POST':
        param = _validateDetailParam()
        if type(param) == str:
            return jsonify(
                success=False,
                message=param,
                content=None
            )
    else:
        return render_template('detail/index.html')
