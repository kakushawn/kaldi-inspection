from . import main
from . import common
# from . import ns_class
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
        
        wav_path = os.path.join(
            current_app.config['UPLOAD_FOLDER'], wav_id + '.wav')

        print ("wav_path: ", wav_path)
        request.files['data'].save(wav_path)

        os.system("cp {} {}".format(wav_path, os.path.join(
            current_app.config['RUN_FOLDER'], 'local', 'demo')))
        os.system(
            "cd {} && ./demo.sh {}".format(current_app.config['RUN_FOLDER'], wav_id))
        #os.system(
        #    "cp {} {}".format(os.path.join(current_app.config['DEMO_FOLDER'], 
        #    wav_id+'_16k.wav'), current_app.config['UPLOAD_FOLDER']))

        with open(os.path.join(current_app.config['UPLOAD_FOLDER'], wav_id + '_decode_result.txt'), "r") as f:
            line = f.read()
            decode_result = line.split('\n')[0].split("test_utt ")[1]
            print (decode_result)

        return jsonify(
            message=decode_result,
        )
    except Exception as e:
        # raise
        return jsonify(
            message=str(e),
        )


