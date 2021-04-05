<?php
/**
 * @author Nicolas CARPi <nico-git@deltablot.email>
 * @copyright 2012 Nicolas CARPi
 * @see https://www.elabftw.net Official website
 * @license AGPL-3.0
 * @package elabftw
 */
declare(strict_types=1);

namespace Elabftw\Elabftw;

use Elabftw\Interfaces\ProcessorInterface;
use Elabftw\Models\Users;
use Symfony\Component\HttpFoundation\Request;

/**
 * Process a request
 */
class RequestProcessor extends Processor implements ProcessorInterface
{
    public function __construct(Users $users, Request $request)
    {
        parent::__construct($users, $request);
    }

    // @phpstan-ignore-next-line
    public function getParams()
    {
    }

    // process a classic request
    protected function process(Request $request): void
    {
        $itemId = null;
        if ($request->getMethod() === 'POST') {
            $what = $request->request->get('what');
            $type = $request->request->get('type');
            $params = $request->request->get('params') ?? array();
        } else {
            $what = $request->query->get('what');
            $type = $request->query->get('type');
            $params = $request->query->get('params') ?? array();
        }

        if (isset($params['itemId'])) {
            $itemId = (int) $params['itemId'];
        }

        $this->Entity = $this->getEntity($type, $itemId);
        $this->Model = $this->findModel($what);
    }
}
