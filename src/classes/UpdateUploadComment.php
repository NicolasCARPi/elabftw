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

use Elabftw\Exceptions\ImproperActionException;
use Elabftw\Interfaces\UpdateParamsInterface;
use function mb_strlen;

final class UpdateUploadComment extends UpdateUpload implements UpdateParamsInterface
{
    private const MIN_COMMENT_SIZE = 2;

    private string $content;

    public function __construct(PayloadProcessor $payload)
    {
        parent::__construct($payload);
        $this->content = $payload->content;
        $this->target = 'comment';
    }

    public function getContent(): string
    {
        // check for length
        if (mb_strlen($this->content) < self::MIN_COMMENT_SIZE) {
            throw new ImproperActionException(sprintf(_('Input is too short! (minimum: %d)'), 2));
        }
        return $this->content;
    }
}