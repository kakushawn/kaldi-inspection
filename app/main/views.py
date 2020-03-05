from . import main
from . import common
from . import log_class
from .. import commands
from .. import commands2
from hanziconv import HanziConv

import os
import time
from flask import jsonify, redirect
from flask import request, send_from_directory, current_app
import uuid


@main.route('/', methods=['GET'])
def main_portal():
    return redirect('/static/demo.html', code=302)

# check decoding pass threshold
def _challengeThreshold(command_type, command, loglike):
    if (command_type == 'test_yn_en' or command_type == 'test_yn_ch'):
        return True;
    command_thresholds = commands.commands['command']
    command = HanziConv.toSimplified(command)
    print ('decoded command:' + command)
    print ('decoded loglike:' + str(loglike))
    print ('command threshold: ')
    print (command_thresholds[command]['threshold'])
    print ( float(loglike) > float(command_thresholds[command]['threshold']) )
    return float(loglike) > float(command_thresholds[command]['threshold']) 

def _challengeThreshold2(command_type, command, loglike):
    command_thresholds = commands2.commands
    command = HanziConv.toSimplified(command)
    print ('decoded command:' + command)
    print ('decoded loglike:' + str(loglike))
    print ('command threshold: ')
    print (command_thresholds[command])
    print ( float(loglike) > float(command_thresholds[command]) )
    return float(loglike) > float(command_thresholds[command]) 


@main.route('/ajax_record', methods=['POST'])
def ajax_record():
    # parse argument
    try:
        wav_id = str(uuid.uuid4())
        
        decode_result = _decode(wav_id)
        print (">>> RESULT:", decode_result)

        return jsonify(decode_result)

    except Exception as e:
        # raise
        return jsonify(
            success=False,
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

    ## TODO：decode result should be in json format
    with open(os.path.join(current_app.config['UPLOAD_FOLDER'], wav_id + '_decode_result.txt'), "r") as f:
        lines = f.read().splitlines()

    if len(lines) != 2:
        success = False
        command = ''
        trustworthy = False
    else:
        success = True
        command = lines[0].split(' ')[1]
        loglike = float(lines[1].split(' ')[-4])
        trustworthy = _challengeThreshold2(command_type, command, loglike)

    return {
        'success': success,
        'data' : {
            'message': command,
            'trustworthy': trustworthy
        }
    };

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
