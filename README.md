# MIR kaldi inspection tool

## start server

1. `git clone https://github.com/kakushawn/kaldi-inspection`

2. `cd kaldi-inspection`

3. `pip install -r requirements.txt`

4. 修改 `config.py`，把 ROOT_FOLDER 改成對應路徑。

5. 執行 `python run.py` 啟動 server，應該可以連到 localhost:5000


## linking kaldi dependencies

1. 將語料建立軟連結到 static/dataset/ 下。

    `ln -s /mnt/corpus/dataset/cctv static/dataset/`

2. 將 kaldi/scripts 腳本複製到 kaldi 腳本目錄下。

    `cp kaldi/scripts/* ~/kaldi/egs/aishell/s5/`

3. 在 kaldi 腳本目錄下，執行 `gen_mir_web_ana_data.sh`，把 decode 結果產生網站需要的文件。
  * usage:

    `gen_mir_web_ana_data.sh corpus data_of_decode graph/lang decode_dir`

    * corpus: 語料目錄名稱
    * data_of_decode: 該次 decode 執行時的 data 目錄
    * graph/lang: 該次 decode 時用到的 graph 或 lang 目錄
    * decode_dir: decode 完的目錄

    * example:

      ```
      cd ~/kaldi/egs/aishell/s5/
      gen_mir_web_ana_data.sh cctv data/cctv_test data/lang_cctv_test exp/chain/tdnn_1a_sp_noised/decode_cctv_foxconn_test_mixlm
      ```

4. 回到網站目錄，在 kaldi/decodes/ 建立 decode 目錄的軟連結。

    `ln -s ~/kaldi/egs/aishell/s5/exp/chain/tdnn_1a_sp_noised/decode_cctv_foxconn_test_mixlm kaldi/decodes/`

5. 打開首頁，選項應該有剛剛新增的 decode 目錄。若要再新增其他目錄重複步驟 3 到 4 即可。


