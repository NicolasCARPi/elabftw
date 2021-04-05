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

use Elabftw\Interfaces\UpdateParamsInterface;

final class UpdateStepBody extends UpdateStep implements UpdateParamsInterface
{
    public function __construct(int $id, string $content)
    {
        parent::__construct($id, $content);
        $this->target = 'body';
    }
}
