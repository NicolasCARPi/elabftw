/**
 * @author Nicolas CARPi <nico-git@deltablot.email>
 * @copyright 2012 Nicolas CARPi
 * @see https://www.elabftw.net Official website
 * @license AGPL-3.0
 * @package elabftw
 */
import { notif } from './misc';
import tinymce from 'tinymce/tinymce';
import { getTinymceBaseConfig } from './tinymce';
import Apikey from './Apikey.class';
import Template from './Template.class';
import { Ajax } from './Ajax.class';
import i18next from 'i18next';

$(document).ready(function() {
  if (window.location.pathname !== '/ucp.php') {
    return;
  }

  // show the handles to reorder when the menu entry is clicked
  $('#toggleReorder').on('click', function() {
    $('.sortableHandle').toggle();
  });

  const ApikeyC = new Apikey();
  const TemplateC = new Template();

  // MAIN LISTENER
  document.querySelector('.real-container').addEventListener('click', (event) => {
    const el = (event.target as HTMLElement);
    // CREATE TEMPLATE
    if (el.matches('[data-action="create-template"]')) {
      const title = prompt(i18next.t('template-title'));
      if (title) {
        // no body on template creation
        TemplateC.create(title).then(json => {
          window.location.replace(`ucp.php?tab=3&templateid=${json.value}`);
        });
      }
    // LOCK TEMPLATE
    } else if (el.matches('[data-action="lock-template"]')) {
      // reload the page to change the icon and make the edit button disappear (#1897)
      const id = el.dataset.id;
      TemplateC.lock(parseInt(id)).then(() => window.location.href = `?tab=3&templateid=${id}`);
    // DOWNLOAD TEMPLATE
    } else if (el.matches('[data-action="download-template"]')) {
      TemplateC.saveToFile(parseInt(el.dataset.id), el.dataset.name);
    // DESTROY TEMPLATE
    } else if (el.matches('[data-action="destroy-template"]')) {
      if (confirm(i18next.t('generic-delete-warning'))) {
        TemplateC.destroy(parseInt(el.dataset.id))
          .then(() => window.location.replace('ucp.php?tab=3'))
          .catch((e) => notif({'res': false, 'msg': e.message}));
      }

    // CREATE API KEY
    } else if (el.matches('[data-action="create-apikey"]')) {
      // clear any prevous new key message
      const nameInput = (document.getElementById('apikeyName') as HTMLInputElement);
      const content = nameInput.value;
      if (!content) {
        notif({'res': false, 'msg': 'A name is required!'});
        // set the border in red to bring attention
        nameInput.style.borderColor = 'red';
        return;
      }
      const canwrite = parseInt((document.getElementById('apikeyCanwrite') as HTMLInputElement).value);
      ApikeyC.create(content, canwrite).then(json => {
        $('#apiTable').load('ucp.php #apiTable > *');
        const warningDiv = document.createElement('div');
        warningDiv.classList.add('alert', 'alert-warning');
        const chevron = document.createElement('i');
        chevron.classList.add('fas', 'fa-chevron-right');
        warningDiv.appendChild(chevron);

        const newkey = document.createElement('p');
        newkey.innerText = json.value;
        const warningTextSpan = document.createElement('span');

        warningTextSpan.innerText = i18next.t('new-apikey-warning');
        warningTextSpan.classList.add('ml-1');
        warningDiv.appendChild(warningTextSpan);
        warningDiv.appendChild(newkey);
        const placeholder = document.getElementById('newKeyPlaceholder');
        placeholder.innerHTML = '';
        placeholder.appendChild(warningDiv);
      });
    // DESTROY API KEY
    } else if (el.matches('[data-action="destroy-apikey"]')) {
      if (confirm(i18next.t('generic-delete-warning'))) {
        ApikeyC.destroy(parseInt(el.dataset.apikeyid)).then(() => {
          // only reload children of apiTable
          $('#apiTable').load('ucp.php #apiTable > *');
        });
      }
    }
  });

  $('#import-from-file').on('click', function() {
    $('#import_tpl').toggle();
  });

  // CAN READ/WRITE SELECT PERMISSION
  $(document).on('change', '.permissionSelectTpl', function() {
    const value = $(this).val();
    const rw = $(this).data('rw');
    const id = $(this).data('id');
    $.post('app/controllers/EntityAjaxController.php', {
      updatePermissions: true,
      rw: rw,
      id: id,
      type: 'experiments_templates',
      value: value,
    }).done(function(json) {
      notif(json);
    });
  });

  // select the already selected permission for templates
  $(document).on('click', '.modalToggle', function() {
    const read = $(this).data('read');
    const write = $(this).data('write');
    $('#canread_select option[value="' + read + '"]').prop('selected', true);
    $('#canwrite_select option[value="' + write + '"]').prop('selected', true);
  });

  // input to upload an elabftw.tpl file
  document.getElementById('import_tpl').addEventListener('change', (event) => {
    const title = (document.getElementById('import_tpl') as HTMLInputElement).value.replace('.elabftw.tpl', '').replace('C:\\fakepath\\', '');
    if (!window.FileReader) {
      alert('Please use a modern web browser. Import aborted.');
      return false;
    }
    const file = (event.target as HTMLInputElement).files[0];
    const reader = new FileReader();
    reader.onload = function(event): void {
      TemplateC.create(title, event.target.result as string).then(json => {
        window.location.replace(`ucp.php?tab=3&templateid=${json.value}`);
      });

      $('#import_tpl').hide();
    };
    reader.readAsText(file);
  });

  // TinyMCE
  tinymce.init(getTinymceBaseConfig('ucp'));
});
