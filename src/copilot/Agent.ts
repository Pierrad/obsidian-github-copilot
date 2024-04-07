import { ChildProcessWithoutNullStreams, spawn } from "child_process";

class Agent {
  private agent: ChildProcessWithoutNullStreams;

  public startAgent(nodePath: string, agentPath: string): void {
    this.agent = spawn(
      nodePath,
      [agentPath, '--stdio'],
      {
        shell: true,
        stdio: 'pipe'
      }
    );
  }

  public stopAgent(): void {
    this.agent.kill();
  }

  public logger(): void {
    this.agent.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });

    this.agent.stderr.on('data', (data) => {
      console.log(`stderr: ${data}`);
    });

    this.agent.on('exit', (code) => {
      console.log(`child process exited with code ${code}`);
    });
  }

  public getAgent(): ChildProcessWithoutNullStreams {
    return this.agent;
  }
}

export default Agent;