/**
 * @author Nicolas CARPi <nico-git@deltablot.email>
 * @copyright 2012 Nicolas CARPi
 * @see https://www.elabftw.net Official website
 * @license AGPL-3.0
 * @package elabftw
 */
import 'jquery-jeditable/src/jquery.jeditable.js';
import { notif } from './misc';
import { Metadata } from './Metadata.class';
declare let key: any;
const moment = require('moment'); // eslint-disable-line @typescript-eslint/no-var-requires

document.addEventListener('DOMContentLoaded', () => {
  if ($('#info').data('page') !== 'view') {
    return;
  }
  // add the title in the page name (see #324)
  document.title = $('.title-view').text() + ' - eLabFTW';

  const type = $('#info').data('type');
  const id = $('#info').data('id');

  // add extra fields elements from metadata json
  const MetadataC = new Metadata(type, id);
  MetadataC.display('view');

  // EDIT
  key($('#shortcuts').data('edit'), function() {
    window.location.href = '?mode=edit&id=' + id;
  });

  // TOGGLE LOCK
  $('#lock').on('click', function() {
    $.post('app/controllers/EntityAjaxController.php', {
      lock: true,
      type: type,
      id: id
    }).done(function(json) {
      notif(json);
      if (json.res) {
        // reload the page to change the icon and make the edit button disappear
        // and fix the issue #1897
        window.location.href = '?mode=view&id=' + id;
      }
    });
  });

  // CLICK TITLE TO GO IN EDIT MODE
  $(document).on('click', '.click2Edit', function() {
    window.location.href = '?mode=edit&id=' + id;
  });

  // CLICK SEE EVENTS BUTTON
  $(document).on('click', '.seeEvents', function() {
    $.get('app/controllers/EntityAjaxController.php', {
      getBoundEvents: true,
      type: type,
      id: id
    }).done(function(json) {
      if (json.res) {
        let bookings = '';
        for(let i=0; i < json.msg.length; i++) {
          bookings = bookings + '<a href="team.php?item=' + json.msg[i].item + '&start=' + encodeURIComponent(json.msg[i].start) + '"><button class="mr-2 btn btn-neutral relative-moment">' + moment(json.msg[i].start).fromNow() + '</button></a>';
        }
        $('#boundBookings').html(bookings);
      }
    });
  });

  // DECODE ASN1
  $(document).on('click', '.decodeAsn1', function() {
    $.post('app/controllers/ExperimentsAjaxController.php', {
      asn1: $(this).data('token'),
      id: $(this).data('id')
    }).done(function(data) {
      $('#decodedDiv').html(data.msg);
    });
  });

  // DUPLICATE
  $('.view-action-buttons').on('click', '.duplicateItem', function() {
    $.post('app/controllers/EntityAjaxController.php', {
      duplicate: true,
      id: $(this).data('id'),
      type: type
    }).done(function(data) {
      window.location.replace('?mode=edit&id=' + data.msg);
    });
  });

  // SHARE
  $('.view-action-buttons').on('click', '.shareItem', function() {
    $.get('app/controllers/EntityAjaxController.php', {
      getShareLink: true,
      id: $(this).data('id'),
      type: type
    }).done(function(data) {
      $('#shareLinkInput').val(data.msg).toggle().focus().select();
    });
  });

  // TIMESTAMP
  $('#goForTimestamp').on('click', function() {
    $(this).prop('disabled', true);
    $.post('app/controllers/ExperimentsAjaxController.php', {
      timestamp: true,
      id: id
    }).done(function(json) {
      if (json.res) {
        window.location.replace('experiments.php?mode=view&id=' + id);
      } else {
        $('.modal-body').css('color', 'red');
        $('.modal-body').html(json.msg);
      }
    });
  });

  // TOGGLE PINNED
  $('#pinIcon').on('click', function() {
    $.post('app/controllers/EntityAjaxController.php', {
      togglePin: true,
      type: type,
      id: id
    }).done(function(json) {
      if (json.res) {
        $('#pinIcon').find('[data-fa-i2svg]').toggleClass('grayed-out');
      }
      notif(json);
    });
  });
});
