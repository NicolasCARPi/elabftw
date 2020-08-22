/**
 * @author Nicolas CARPi <nico-git@deltablot.email>
 * @copyright 2012 Nicolas CARPi
 * @see https://www.elabftw.net Official website
 * @license AGPL-3.0
 * @package elabftw
 */
declare let key: any;

import { notif } from './misc';
import JSONEditor from 'jsoneditor';

// editor div
$(document).ready(function() {
  if (!($('#info').data('page') === 'edit' || $('#info').data('page') === 'view')) {
    return;
  }
  const container = document.getElementById('jsonEditorContainer');

  const options = {
    modes: (($('#info').data('page') === 'edit') ? ['tree','code','view','form','text']:['view']),
    onModeChange: function(newMode) {
      if (newMode==='code' || newMode==='text'){
        $('#jsoneditor').height('800px');
      } else {
        $('#jsoneditor').removeAttr('style');
      }
    }
  };

  // only do stuff if the container is here (so user option is set)
  if (container) {
    const editor = new JSONEditor(container, options);

    // temporary fix for elabftw css where all input have padding of 7px until css is fixed
    $('.jsoneditor-search').find('input').css('padding', '0px');

    // fix the keymaster shortcut library interfering with the editor
    key.filter = function(event): boolean {
      const tagName = (event.target || event.srcElement).tagName;
      return !(tagName == 'INPUT' || tagName == 'SELECT' || tagName == 'TEXTAREA' || (event.target || event.srcElement).hasAttribute('contenteditable'));
    };

    let currentFileItemID: string;

    // the loader action appears under .json uploaded files
    $(document).on('click', '.jsonLoader', function() {
      // add the filename as a title
      $('#jsonEditorTitle').html('Filename: ' + $(this).data('name'));
      $.get('app/download.php', {
        f: $(this).data('link')
      }).done(function(data) {
        try {
          editor.set(JSON.parse(data));
          $('#jsonEditorDiv').collapse('show');
          if ($('.jsonEditorPlusMinusButton').html() === '+') {
            $('.jsonEditorPlusMinusButton').html('-').addClass('btn-neutral').removeClass('btn-primary');
          }
        } catch(e) {
          // If it is just a parsing error, then we let the user edit the file.
          if (e.message.includes('JSON.parse')) {
            editor.setMode('text');
            editor.updateText(data);
            $('#jsonEditorDiv').show();
          } else {
            notif({'res': false, 'msg':'JSON Editor: ' + e.message});
          }
        }
      });
      currentFileItemID = $(this).data('uploadid');
    });

    // The save function is now defined separately
    const saveJsonFile = function(){
      if (typeof currentFileItemID === 'undefined') {
        // we are creating a new file
        const realName = prompt('Enter name of the file');
        if (realName == null) {
          return;
        }
        // add the new name for the file as a title
        $('#jsonEditorTitle').html('Filename: ' + realName + '.json');
        $.post('app/controllers/EntityAjaxController.php', {
          addFromString: true,
          type: 'experiments',
          id: $('#info').data('id'),
          realName: realName,
          fileType: 'json',
          string: JSON.stringify(editor.get())
        }).done(function(json) {
          $('#filesdiv').load('experiments.php?mode=edit&id=' + $('#info').data('id') + ' #filesdiv');
          currentFileItemID = String(json.uploadId);
          notif(json);
        });
      } else {
        // we are editing an existing file
        const formData = new FormData();
        const blob = new Blob([JSON.stringify(editor.get())], { type: 'application/json' });
        formData.append('replace', 'true');
        formData.append('upload_id', currentFileItemID);
        formData.append('id', $('#info').data('id'));
        formData.append('type', 'experiments');
        formData.append('file', blob);

        $.post({
          url: 'app/controllers/EntityAjaxController.php',
          data: formData,
          processData: false,
          contentType: false,
          success:function(json){
            notif(json);
          }
        });
      }
    };

    // Add support for 'Save as' by resetting the currentFileItemID to undefined
    $(document).on('click', '.jsonSaveAs', function () {
      currentFileItemID = undefined;
      saveJsonFile();
    });

    $(document).on('click', '.jsonSaver', saveJsonFile);
  }
});
