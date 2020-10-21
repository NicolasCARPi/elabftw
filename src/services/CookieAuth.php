<?php
/**
 * @author Nicolas CARPi <nico-git@deltablot.email>
 * @copyright 2012 Nicolas CARPi
 * @see https://www.elabftw.net Official website
 * @license AGPL-3.0
 * @package elabftw
 */
declare(strict_types=1);

namespace Elabftw\Services;

use Elabftw\Elabftw\AuthResponse;
use Elabftw\Elabftw\Db;
use Elabftw\Exceptions\InvalidCredentialsException;
use Elabftw\Interfaces\AuthInterface;
use Elabftw\Models\Teams;
use Elabftw\Models\Users;

/**
 * Authenticate with the cookie
 */
class CookieAuth implements AuthInterface
{
    /** @var Db $Db SQL Database */
    private $Db;

    /** @var string $token */
    private $token;

    /** @var int $tokenTeam */
    private $tokenTeam;

    public function __construct(string $token, string $tokenTeam)
    {
        $this->Db = Db::getConnection();
        $this->token = Check::token($token);
        $this->tokenTeam = (int) Filter::sanitize($tokenTeam);
    }

    public function tryAuth(): AuthResponse
    {
        // compare the provided token with the token saved in SQL database
        $sql = 'SELECT userid, mfa_secret FROM users WHERE token = :token LIMIT 1';
        $req = $this->Db->prepare($sql);
        $req->bindParam(':token', $this->token);
        $this->Db->execute($req);
        if ($req->rowCount() !== 1) {
            throw new InvalidCredentialsException();
        }
        $res = $req->fetch();
        $userid = (int) $res['userid'];
        // when doing auth with cookie, we take the token_team value
        // make sure user is in team because we can't trust it
        $Teams = new Teams(new Users($userid));
        if (!$Teams->isUserInTeam($userid, $this->tokenTeam)) {
            throw new InvalidCredentialsException();
        }

        $AuthResponse = new AuthResponse();
        $AuthResponse->userid = $userid;
        $AuthResponse->mfaSecret = $res['mfa_secret'];
        $AuthResponse->selectedTeam = $this->tokenTeam;
        return $AuthResponse;
    }
}
