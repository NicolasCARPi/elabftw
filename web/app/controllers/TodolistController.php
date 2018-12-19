<?php
/**
 * @author Nicolas CARPi <nicolas.carpi@curie.fr>
 * @copyright 2012 Nicolas CARPi
 * @see https://www.elabftw.net Official website
 * @license AGPL-3.0
 * @package elabftw
 */
declare(strict_types=1);

namespace Elabftw\Elabftw;

use Elabftw\Exceptions\DatabaseErrorException;
use Elabftw\Exceptions\FilesystemErrorException;
use Elabftw\Exceptions\IllegalActionException;
use Elabftw\Exceptions\ImproperActionException;
use Exception;
use Symfony\Component\HttpFoundation\JsonResponse;

/**
 * For the todolist
 */
require_once \dirname(__DIR__) . '/init.inc.php';

$Response = new JsonResponse();
$Response->setData(array(
    'res' => true,
    'msg' => _('Saved')
));

try {
    $Todolist = new Todolist($App->Users);

    // CREATE
    if ($Request->request->has('create')) {
        $id = $Todolist->create($Request->request->get('body'));
        if ($id) {
            $Response->setData(array(
                'res' => true,
                'msg' => $id
            ));
        }
    }

    // UPDATE
    if ($Request->request->has('update')) {
        $body = $Request->request->filter('body', null, FILTER_SANITIZE_STRING);

        if (\mb_strlen($body) === 0 || $body === ' ') {
            throw new ImproperActionException('Body is too short');
        }

        $id_arr = explode('_', $Request->request->get('id'));
        if (Tools::checkId((int) $id_arr[1]) === false) {
            throw new IllegalActionException('The id parameter is invalid');
        }
        $id = (int) $id_arr[1];
        $Todolist->update($id, $body);
    }

    // UPDATE ORDERING
    if ($Request->request->has('updateOrdering')) {
        $Todolist->updateOrdering($Request->request->all());
    }

    // DESTROY
    if ($Request->request->has('destroy')) {
        $Todolist->destroy($Request->request->get('id'));
        $Response->setData(array(
            'res' => true,
            'msg' => _('Item deleted successfully')
        ));
    }

    // DESTROY ALL
    if ($Request->request->has('destroyAll')) {
        $Todolist->destroyAll();
        $Response->setData(array(
            'res' => true,
            'msg' => _('Item deleted successfully')
        ));
    }

} catch (ImproperActionException $e) {
    $Response->setData(array(
        'res' => false,
        'msg' => $e->getMessage()
    ));

} catch (IllegalActionException $e) {
    $App->Log->notice('', array(array('userid' => $App->Session->get('userid')), array('IllegalAction', $e)));
    $Response->setData(array(
        'res' => false,
        'msg' => Tools::error(true)
    ));

} catch (DatabaseErrorException | FilesystemErrorException $e) {
    $App->Log->notice('', array(array('userid' => $App->Session->get('userid')), array('Error', $e)));
    $Response->setData(array(
        'res' => false,
        'msg' => $e->getMessage()
    ));

} catch (Exception $e) {
    $App->Log->error('', array(array('userid' => $App->Session->get('userid')), array('exception' => $e)));

} finally {
    $Response->send();
}
