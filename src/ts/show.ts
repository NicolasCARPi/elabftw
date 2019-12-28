/**
 * @author Nicolas CARPi <nicolas.carpi@curie.fr>
 * @copyright 2012 Nicolas CARPi
 * @see https://www.elabftw.net Official website
 * @license AGPL-3.0
 * @package elabftw
 */
declare let key: any;
declare let MathJax: any;
import { insertParamAndReload, notif } from './misc';
import 'bootstrap/js/src/modal.js';

$(document).ready(function(){
  $.ajaxSetup({
    headers: {
      'X-CSRF-Token': $('meta[name="csrf-token"]').attr('content')
    }
  });

  // CREATE EXPERIMENT
  key($('#shortcuts').data('create'), function() {
    window.location.href = 'experiments.php?create=true';
  });

  // validate the form upon change. fix #451
  $('.autosubmit').on('change', function() {
    $(this).submit();
  });

  // bodyToggleImg is the little +/- image
  $('.bodyToggleImg').on('click', function() {
    // transform the + in - and vice versa
    $(this).children().toggleClass('fa-minus-circle').toggleClass('fa-plus-circle');

    // get the id to show the toggleBody
    let id = $(this).parent().attr('id');
    const idArr = id.split('_');
    id = idArr[1];
    // get html of body
    $.get('app/controllers/EntityAjaxController.php', {
      getBody : true,
      id : id,
      type : $(this).data('type')
      // and put it in the div and show the div
    }).done(function(data) {
      $('#bodyToggle_' + id).html(data.msg);
      // get the width of the parent. The -30 is to make it smaller than parent even with the margins
      const width = $('#parent_' + id).width() - 30;
      // adjust the width of the children
      $('#bodyToggle_' + id).css('width', width);
      // display div
      $('#bodyToggle_' + id).toggle();
      // ask mathjax to reparse the page
      MathJax.typeset();
    });
  });

  // PAGINATION
  // previous page
  $('.pageButtons').on('click', '.previousPage', function() {
    insertParamAndReload('offset', $('#info').data('offset') - $('#info').data('limit'));
  });
  // next page
  $('.pageButtons').on('click', '.nextPage', function() {
    insertParamAndReload('offset', $('#info').data('offset') + $('#info').data('limit'));
  });
  // END PAGINATION

  // THE CHECKBOXES
  function getCheckedBoxes() {
    const checkedBoxes = [];
    $('input[type=checkbox]:checked').each(function() {
      checkedBoxes.push($(this).data('id'));
    });
    return checkedBoxes;
  }

  const bgColor = '#c4f9ff';

  // CHECK A BOX
  $('input[type=checkbox]').on('click', function() {
    if ($(this).prop('checked')) {
      $(this).parent().parent().css('background-color', bgColor);
    } else {
      $(this).parent().parent().css('background-color', '');
    }
  });

  // CLICK THE CREATE NEW BUTTON
  // done with javascript because if it's a link the css is not clean
  // and there is a gap with the separator
  // also this allows different behavior for exp/items
  $('.createNew').on('click', function() {
    const path = window.location.pathname;
    if (path.split('/').pop() === 'experiments.php') {
      insertParamAndReload('create', 1);
    } else {
      $('#createModal').modal('toggle');
    }
  });

  // EXPAND ALL
  $('#expandAll').on('click', function() {
    if ($(this).data('status') === 'closed') {
      $(this).data('status', 'opened');
      $(this).text($(this).data('collapse'));
    } else {
      $(this).data('status', 'closed');
      $(this).text($(this).data('expand'));
    }
    $('.bodyToggleImg').each(function() {
      $(this).trigger('click');
    });
  });

  // SELECT ALL
  $('#selectAllBoxes').on('click', function() {
    $('input[type=checkbox]').prop('checked', true);
    $('input[type=checkbox]').parent().parent().css('background-color', bgColor);
    $('#advancedSelectOptions').show();
    $('#withSelected').show();
    // also disable pagination because this will select all even the hidden ones
    $('section.item:hidden').show();
    $('#loadAllButton').hide(); // hide load button when there is nothing more to show
    $('#loadButton').hide(); // hide load button when there is nothing more to show
  });

  // UNSELECT ALL
  $('#unselectAllBoxes').on('click', function() {
    $('input:checkbox').prop('checked', false);
    $('input[type=checkbox]').parent().parent().css('background-color', '');
    // hide menu
    $('#withSelected').hide();
    $('#advancedSelectOptions').hide();
  });

  // INVERT SELECTION
  $('#invertSelection').on('click', function() {
    (<any>$('input[type=checkbox]')).each(function () {
      this.checked = !this.checked;
      if ($(this).prop('checked')) {
        $(this).parent().parent().css('background-color', bgColor);
      } else {
        $(this).parent().parent().css('background-color', '');
      }
    });
  });

  // hide the "with selected" block if no checkboxes are checked
  $('#withSelected').hide();
  // no need to show the unselect/invert links if no one is selected
  $('#advancedSelectOptions').hide();
  $('input[type=checkbox]').on('click', function() {
    $('#advancedSelectOptions').show();
    $('#withSelected').show();
  });

  // UPDATE THE STATUS/ITEM TYPE OF SELECTED BOXES ON SELECT CHANGE
  $('#catChecked').on('change', function() {
    const ajaxs = [];
    // get the item id of all checked boxes
    const checked = getCheckedBoxes();
    if (checked.length === 0) {
      const json = {
        'msg': 'Nothing selected!',
        'res': false
      };
      notif(json);
      return;
    }
    // loop on it and update the status/item type
    $.each(checked, function(index, value) {
      ajaxs.push($.post('app/controllers/EntityAjaxController.php', {
        updateCategory : true,
        id : value,
        categoryId : $('#catChecked').val(),
        type : $('#type').data('type')
      }));
    });
    // reload the page once it's done
    // a simple reload would not work here
    // we need to use when/then
    $.when.apply(null, ajaxs).then(function (){
      window.location.reload();
    });
  });

  // UPDATE THE VISIBILTY OF AN EXPERIMENT ON SELECT CHANGE
  $('#visChecked').on('change', function() {
    const ajaxs = [];
    // get the item id of all checked boxes
    const checked = getCheckedBoxes();
    if (checked.length === 0) {
      const json = {
        'msg': 'Nothing selected!',
        'res': false
      };
      notif(json);
      return;
    }
    // loop on it and update the status/item type
    $.each(checked, function(index, value) {
      ajaxs.push($.post('app/controllers/EntityAjaxController.php', {
        updatePermissions : true,
        rw: 'read',
        id : value,
        visibility : $('#visChecked').val(),
        type : $('#type').data('type')
      }));
    });
    // reload the page once it's done
    // a simple reload would not work here
    // we need to use when/then
    $.when.apply(null, ajaxs).then(function (){
      window.location.reload();
    });
    notif({'msg': 'Saved', 'res': true});
  });

  // MAKE ZIP/CSV
  $('.csvzip').on('click', function() {
    const checked = getCheckedBoxes();
    if (checked.length === 0) {
      const json = {
        'msg': 'Nothing selected!',
        'res': false
      };
      notif(json);
      return;
    }
    // grey out the box to signal it has been clicked
    $(this).attr('disabled', 'disabled');
    // also display a wait text
    $(this).html('Please wait…');
    const type = $('#type').data('type');
    const what = $(this).data('what');
    window.location.href = 'make.php?what=' + what + '&type=' + type + '&id=' + checked.join('+');
  });

  // THE DELETE BUTTON FOR CHECKED BOXES
  $('#deleteChecked').on('click', function() {
    // get the item id of all checked boxes
    const checked = getCheckedBoxes();
    if (checked.length === 0) {
      const json = {
        'msg': 'Nothing selected!',
        'res': false
      };
      notif(json);
      return;
    }
    if (!confirm($('#info').data('confirm'))) {
      return false;
    }
    // loop on it and delete stuff
    $.each(checked, function(index, value) {
      $.post('app/controllers/EntityAjaxController.php', {
        destroy: true,
        id: value,
        type: $('#type').data('type')
      }).done(function(json) {
        notif(json);
        if (json.res) {
          $('#parent_' + value).hide(200);
        }
      });
    });
  });
});
