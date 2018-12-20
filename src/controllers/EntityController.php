<?php
/**
 * @author Nicolas CARPi <nicolas.carpi@curie.fr>
 * @copyright 2012 Nicolas CARPi
 * @see https://www.elabftw.net Official website
 * @license AGPL-3.0
 * @package elabftw
 */
declare(strict_types=1);

namespace Elabftw\Controllers;

use Elabftw\Elabftw\App;
use Elabftw\Elabftw\Database;
use Elabftw\Interfaces\ControllerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Response;

/**
 * For experiments.php
 */
class EntityController implements ControllerInterface
{
    /** @var App $App instance of App */
    protected $App;

    /**
     * Constructor
     *
     * @param App $app
     */
    public function __construct(App $app)
    {
        $this->App = $app;
    }

    /**
     * Get the Response object from the Request
     *
     * @return Response
     */
    public function getResponse(): Response
    {
        // VIEW
        if ($this->App->Request->query->get('mode') === 'view') {
            return $this->view();
        }

        // EDIT
        if ($this->App->Request->query->get('mode') === 'edit') {
            return $this->edit();
        }

        // CREATE
        if ($this->App->Request->query->has('create')) {
            $id = $this->Entity->create((int) $this->App->Request->query->get('tpl'));
            return new RedirectResponse('../../' . $this->page . '?mode=edit&id=' . $id);
        }

        // UPDATE RATING
        if ($this->App->Request->request->has('rating') && $this->Entity instanceof Database) {
            $this->Entity->setId((int) $this->App->Request->request->get('id'));
            $this->Entity->updateRating((int) $this->App->Request->request->get('rating'));
            $Response = new JsonResponse();
            $Response->setData(array(
                'res' => true,
                'msg' => _('Saved')
            ));
            return $Response;
        }

        // DEFAULT MODE IS SHOW
        return $this->show();
    }
}
