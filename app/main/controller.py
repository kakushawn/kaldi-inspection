from . import main
from flask import request, jsonify, redirect
# from flask import send_from_directory, current_app
# import time
# import uuid
# from hanziconv import HanziConv
# from . import log_class
from ..service import kaldi
# import os


@main.route('/', methods=['GET'])
def main_portal():
    return redirect('/static/demo.html', code=302)


@main.route('/kaldi/show', methods=['GET'])
def fetch():
    param = {
        'expid': request.args.get('expid'),
        'criterion': request.args.get('criterion', 'wer'),
        'sort': request.args.get('sort', default='des')
    }
    if param['expid'] is None \
            or param['sort'] not in ['des', 'asc']\
            or param['criterion'] not in ['wer', 'cer']:
        return jsonify(
            success=False,
            message="invalid params",
            content=None
        )
    content = kaldi.showExp(param)
    if content is None:
        success = False
        message = "Exp does not exist"
    else:
        success = True
        message = ""
    return jsonify(
        success=success,
        message=message,
        content=content
    )
    # return "---------------------"
