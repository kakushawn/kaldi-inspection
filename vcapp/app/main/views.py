from . import main
from . import common
from . import log_class

import os
import time
from flask import jsonify, redirect
from flask import request, send_from_directory, current_app
import uuid


@main.route('/', methods=['GET'])
def main_portal():
    return redirect('/static/demo.html', code=302)

@main.route('/ajax_record', methods=['POST'])
def ajax_record():
    # parse argument
    try:
        wav_id = str(uuid.uuid4())
        
        decode_result = _decode(wav_id)
        print (">>> RESULT:", decode_result)

        return jsonify(
            message=decode_result,
        )
    except Exception as e:
        # raise
        return jsonify(
            message=str(e),
        )

def _decode(wav_id):
    """ decode by wav_id here"""
    wav_path = os.path.join(
            current_app.config['UPLOAD_FOLDER'], wav_id + '.wav')

    print (">>>>> WAV_PATH: ", wav_path)
    request.files['wav_data'].save(wav_path)    
    command_type = request.form['command_type']
    print (">>>>> COMMAND_TYPE:", command_type)

    os.system("cp {} {}".format(wav_path, os.path.join(
        current_app.config['RUN_FOLDER'], 'local', 'demo')))
    os.system(
        "cd {} && ./demo.sh {} {}".format(current_app.config['RUN_FOLDER'], wav_id, command_type))

    with open(os.path.join(current_app.config['UPLOAD_FOLDER'], wav_id + '_decode_result.txt'), "r") as f:
        line = f.read()
        decode_result = line.split('\n')[0].split("test_utt ")[1]

    return decode_result

# @main.route('decode_youtube', methods['GET'])
# def decode_youtube():
#     # get video id from client

#     # youtube-dl video get wavfile

#     # decode youtube-dled wav file

#     # return result
#     result = {
#         'success' : False,
#         'message' : ''
#     }

#     return jsonify(result)
